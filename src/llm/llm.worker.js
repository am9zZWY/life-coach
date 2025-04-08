// llm.worker.js
import log from "loglevel"; // Assuming loglevel is available or handle differently
import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

let handler; // No type needed in JS

self.addEventListener("message", (event) => {
	// Optional: Add initial message handling if needed before handler is ready
	console.log("Worker received initial message:", event.data);
});

self.onmessage = (msg) => { // msg is implicitly MessageEvent
	if (!handler) {
		// Optionally configure the handler here if needed, e.g., with specific models
		// const modelId = "gemma-2b-it-q4f32_1"; // Example: Or get from an init message
		handler = new WebWorkerMLCEngineHandler(/* modelId */);
		log.info("Web Worker: Web-LLM Engine Handler Activated");
	}
	// Forward the message event (including data) to the webLLM handler
	handler.onmessage(msg);
};

// Optional: Add error handling for the worker itself
self.onerror = (error) => {
	log.error("Unhandled error in LLM Worker:", error);
	// You might want to post an error message back to the main thread
	// self.postMessage({ type: 'error', data: 'Critical worker error' });
};
