/**
 * Thanks to @xenova for the transformers package
 *
 * https://github.com/xenova
 */
import {AutoModelForCausalLM, AutoTokenizer, env, StoppingCriteria, TextStreamer} from '@huggingface/transformers'

env.allowLocalModels = false;
env.useBrowserCache = true;

class CallbackTextStreamer extends TextStreamer {
	constructor(tokenizer, cb) {
		super(tokenizer, {
			skip_prompt: true,
			skip_special_tokens: true,
		});
		this.cb = cb;
	}

	on_finalized_text(text) {
		this.cb(text);
	}
}

class InterruptableStoppingCriteria extends StoppingCriteria {
	constructor() {
		super();
		this.interrupted = false;
	}

	interrupt() {
		this.interrupted = true;
	}

	reset() {
		this.interrupted = false;
	}

	_call(input_ids, scores) {
		return new Array(input_ids.length).fill(this.interrupted);
	}
}

const stopping_criteria = new InterruptableStoppingCriteria();

class TextGenerationPipeline {
	static model_id = null;
	static model = null;
	static tokenizer = null;
	static streamer = null;

	static async getInstance(progress_callback = null) {
		// Choose the model based on whether fp16 is available
		this.model_id ??= "onnx-community/Qwen2.5-0.5B-Instruct"

		this.tokenizer ??= AutoTokenizer.from_pretrained(this.model_id, {
			legacy: true,
			progress_callback,
		});

		const config = {
			dtype: 'q4',
			device: 'wasm',
			progress_callback,
		}

		// Check if WebGPU is available for newer browsers
		if (navigator.gpu) {
			config.device = "webgpu";
		}

		this.model ??= AutoModelForCausalLM.from_pretrained(this.model_id, config);

		return Promise.all([this.tokenizer, this.model]);
	}
}

async function generate(messages) {
	// Retrieve the text-generation pipeline.
	const [tokenizer, model] = await TextGenerationPipeline.getInstance();

	const inputs = tokenizer.apply_chat_template(messages, {
		add_generation_prompt: true,
		return_dict: true,
	});

	let startTime;
	let numTokens = 0;
	const cb = (output) => {
		startTime ??= performance.now();

		let tps;
		if (numTokens++ > 0) {
			tps = numTokens / (performance.now() - startTime) * 1000;
		}
		console.debug({
			output, tps, numTokens,
		});
	}

	const streamer = new CallbackTextStreamer(tokenizer, cb);

	// Tell the main thread we are starting
	self.postMessage({status: 'start'});

	const outputs = await model.generate({
		...inputs,
		max_new_tokens: 100,
		temperature: 0.7,
		top_p: 0.95,
		top_k: 40,
		repetition_penalty: 1.1,
		return_full_text: false,
		streamer,
		stopping_criteria,
	});
	const outputText = tokenizer.batch_decode(outputs, {skip_special_tokens: false});

	// Send the output back to the main thread
	self.postMessage({
		status: 'finished',
		output: outputText,
	});
}

async function load() {
	self.postMessage({
		status: 'loading',
		data: 'Loading model...'
	});

	// Load the pipeline and save it for future use.
	const [tokenizer, model] = await TextGenerationPipeline.getInstance(x => {
		// We also add a progress callback to the pipeline so that we can
		// track model loading.
		self.postMessage(x);
	});

	self.postMessage({
		status: 'loading',
		data: 'Compiling shaders and warming up model...'
	});

	// Run model with dummy input to compile shaders
	const inputs = tokenizer('a');
	await model.generate({...inputs, max_new_tokens: 1});
	self.postMessage({status: 'ready'});
}


self.addEventListener('message', async (e) => {
	const {type, data} = e.data;

	console.debug('Worker received message:', e.type, e.data);

	switch (type) {
		case 'init':
			load();
			break;

		case 'run':
			stopping_criteria.reset();
			generate(data);
			break;

		case 'interrupt':
			stopping_criteria.interrupt();
			break;

		case 'reset':
			stopping_criteria.reset();
			break;
	}
})
