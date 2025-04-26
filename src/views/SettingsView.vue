<script lang="ts" setup>
import { Check, Cloud, MapPin, Settings } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from 'reka-ui'
import { useWeatherStore } from '@/stores/weather.ts'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'vue-sonner'
import { useGptStore } from '@/stores/gpt.ts'
import { useCalendarStore } from '@/stores/calendar.ts'
import { useDB } from '@/composables/db.ts'
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { useDavStore } from '@/stores/dav.ts'
import { Textarea } from '@/components/ui/textarea'

const gptStore = useGptStore()
const { openAiApiKey, personalInformation } = storeToRefs(gptStore)

const weatherStore = useWeatherStore()
const { location, weatherApiKey } = storeToRefs(weatherStore)

const calendarStore = useCalendarStore()
const { calendarIcsUrls } = storeToRefs(calendarStore)
const calendarUrlInput = ref<string>('')

const davStore = useDavStore()
const { appleCredentials } = storeToRefs(davStore)

const openAiApiKeyInput = ref<string>(openAiApiKey.value) // local input
const weatherApiKeyInput = ref<string>(weatherApiKey.value) // local input
const locationInput = ref<string>(location.value) // local input
const appleIdInput = ref<string>(appleCredentials.value.appleId)
const appleAppPasswordInput = ref<string>(appleCredentials.value.appleAppPassword)

function updateOpenAiApiKey() {
  openAiApiKey.value = openAiApiKeyInput.value
  toast('API-Schlüssel aktualisiert', {
    description: 'Dein OpenAI API-Schlüssel wurde erfolgreich gespeichert.'
  })
}

function updateLocation() {
  location.value = locationInput.value
  toast('Standort aktualisiert', {
    description: `Wetterinformationen werden jetzt für ${locationInput.value} angezeigt.`
  })
}

function updateWeatherApiKey() {
  weatherApiKey.value = weatherApiKeyInput.value
  toast('API-Schlüssel aktualisiert',
    {
      description: 'Dein Weather API-Schlüssel wurde erfolgreich gespeichert.'
    })
}

function addCalendar() {
  if (calendarUrlInput.value && !calendarIcsUrls.value.includes(calendarUrlInput.value)) {
    calendarIcsUrls.value.push(calendarUrlInput.value)
    toast('Kalender hinzugefügt', {
      description: 'Dein Kalender-URL wurde gespeichert.'
    })
    calendarUrlInput.value = ''
  }
}

function removeCalendar(url: string) {
  calendarIcsUrls.value = calendarIcsUrls.value.filter(u => u !== url)
  toast('Kalender entfernt', {
    description: 'Der Kalender-URL wurde entfernt.'
  })
}

function saveAppleCredentials() {
  appleCredentials.value.appleId = appleIdInput.value
  appleCredentials.value.appleAppPassword = appleAppPasswordInput.value
  toast('Apple-Zugangsdaten gespeichert', {
    description: 'Deine Apple-ID und das App-spezifische Passwort wurden gespeichert.'
  })
}


const db = useDB()
const dbEncodedInput = ref<string>('')

function saveEncodedInput() {
  db.fromString(dbEncodedInput.value)
}

const dbEncoded = computed(() => db.toString())
const qrCode = useQRCode(dbEncoded)
</script>

<template>
  <div class="max-w-2xl mx-auto py-12 px-4">
    <h1 class="text-3xl font-bold mb-6">Einstellungen</h1>

    <!-- OpenAI Settings Card -->
    <Card class="mb-6">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Settings class="h-5 w-5" />
          OpenAI Einstellungen
        </CardTitle>
        <CardDescription>
          Konfiguriere deine OpenAI API-Verbindung
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="updateOpenAiApiKey">
          <div class="space-y-6">
            <Label for="openAiApiKey">OpenAI API Schlüssel</Label>
            <div class="flex space-x-2">
              <Input
                id="openAiApiKey"
                v-model="openAiApiKeyInput"
                placeholder="Füge einen OpenAI API Key ein"
                type="password"
                class="flex-1"
              />
              <Button type="submit" size="sm">
                <Check class="h-4 w-4 mr-2" />
                Speichern
              </Button>
            </div>
            <p class="text-muted-foreground text-sm mt-1">
              Erstelle <a class="underline hover:text-primary" href="https://platform.openai.com/api-keys"
                          target="_blank" rel="noreferrer">hier</a> einen OpenAI Schlüssel.
            </p>
          </div>
        </form>

        <Separator />

        <div>
          <Label for="personalInformation">Persönliche Informationen</Label>
          <Textarea
            id="personalInformation"
            v-model="personalInformation"
            placeholder="Füge persönliche Informationen über dich bereit"
            type="text"
            class="flex-1"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Weather Settings Card -->
    <Card class="mb-6">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Cloud class="h-5 w-5" />
          Wetter Einstellungen
        </CardTitle>
        <CardDescription>
          Konfiguriere die Wetter-Informationen für deine Anwendung
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-6">
          <!-- Location Settings -->
          <form @submit.prevent="updateLocation" class="space-y-2">
            <Label for="location" class="flex items-center gap-1">
              <MapPin class="h-4 w-4" />
              Standort
            </Label>
            <div class="flex space-x-2">
              <Input
                id="location"
                v-model="locationInput"
                type="text"
                placeholder="Für wo möchtest du das Wetter haben?"
                class="flex-1"
              />
              <Button type="submit" size="sm">
                <Check class="h-4 w-4 mr-2" />
                Speichern
              </Button>
            </div>
          </form>

          <Separator />

          <!-- Weather API Key Settings -->
          <form @submit.prevent="updateWeatherApiKey" class="space-y-2">
            <Label for="weatherApiKey">Weather API Schlüssel</Label>
            <div class="flex space-x-2">
              <Input
                id="weatherApiKey"
                v-model="weatherApiKeyInput"
                type="password"
                placeholder="Füge einen Weather API Schlüssel ein"
                class="flex-1"
              />
              <Button type="submit" size="sm">
                <Check class="h-4 w-4 mr-2" />
                Speichern
              </Button>
            </div>
            <p class="text-muted-foreground text-sm mt-1">
              Erstelle <a class="underline hover:text-primary" href="https://www.weatherapi.com/my/" target="_blank"
                          rel="noreferrer">hier</a> einen Weather API Schlüssel.
            </p>
          </form>
        </div>
      </CardContent>
    </Card>

    <!-- Apple Card -->
    <!-- Apple Card -->
    <Card class="mb-6">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple"
               class="h-5 w-5" />
          Apple Einstellungen
        </CardTitle>
        <CardDescription>
          Verbinde deine Apple-Dienste (z.B. Kalender, iCloud)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="saveAppleCredentials" class="space-y-4">
          <div class="space-y-2">
            <Label for="appleId">Apple-ID</Label>
            <Input
              id="appleId"
              v-model="appleIdInput"
              type="email"
              placeholder="Deine Apple-ID (E-Mail)"
              class="flex-1"
            />
          </div>
          <div class="space-y-2">
            <Label for="appleAppPassword">App-spezifisches Passwort</Label>
            <Input
              id="appleAppPassword"
              v-model="appleAppPasswordInput"
              type="password"
              placeholder="App-spezifisches Passwort"
              class="flex-1"
            />
            <p class="text-muted-foreground text-sm mt-1">
              Erstelle ein <a class="underline hover:text-primary" href="https://appleid.apple.com/account/manage"
                              target="_blank" rel="noreferrer">app-spezifisches Passwort</a> für Drittanbieter-Apps.
            </p>
          </div>
          <Button type="submit" size="sm">
            <Check class="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </form>
      </CardContent>
    </Card>


    <!-- ICS Settings Card -->
    <Card class="mb-6">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Cloud class="h-5 w-5" />
          Kalender Einstellungen
        </CardTitle>
        <CardDescription>
          Verwalte Kalender für deine Anwendung
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-6">
          <!-- Add Calendar URL -->
          <form @submit.prevent="addCalendar" class="space-y-2">
            <Label for="calendarUrl">Kalender-URL (ICS)</Label>
            <div class="flex space-x-2">
              <Input
                id="calendarUrl"
                v-model="calendarUrlInput"
                type="url"
                placeholder="Füge eine Kalender-URL (ICS) ein"
                class="flex-1"
              />
              <Button type="submit" size="sm">
                <Check class="h-4 w-4 mr-2" />
                Hinzufügen
              </Button>
            </div>
            <p class="text-muted-foreground text-sm mt-1">
              Unterstützt öffentliche ICS-Links (z.B. von Google Kalender, Outlook, etc.).
            </p>
          </form>

          <Separator />

          <!-- List of Calendar URLs -->
          <div v-if="calendarIcsUrls.length > 0" class="space-y-2">
            <Label>Deine Kalender:</Label>
            <ul class="list-disc pl-5">
              <li v-for="url in calendarIcsUrls" :key="url" class="flex items-center justify-between">
                <span class="break-all">{{ url }}</span>
                <Button variant="destructive" size="xs" @click="removeCalendar(url)">
                  Entfernen
                </Button>
              </li>
            </ul>
          </div>
          <div v-else class="text-muted-foreground text-sm">
            Noch keine Kalender-URLs hinzugefügt.
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Encoded Settings -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Settings class="h-5 w-5" />
          Komprimierte Einstellungen
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div class="flex flex-col gap-2">
          <!-- <img :src="qrCode" alt="QR Code" /> -->
          <span class="text-gray-400 overflow-scroll">{{ dbEncoded }}</span>
        </div>

        <form @submit.prevent="saveEncodedInput" class="space-y-4">
          <div class="space-y-2">
            <Label for="encodedSettings">Komprimierte Einstellungen</Label>
            <div class="flex space-x-2">
              <Input
                id="encodedSettings"
                v-model="dbEncodedInput"
                placeholder="Füge die komprimierten Einstellungen ein"
                type="text"
                class="flex-1"
              />
              <Button type="submit" size="sm">
                <Check class="h-4 w-4 mr-2" />
                Speichern
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
