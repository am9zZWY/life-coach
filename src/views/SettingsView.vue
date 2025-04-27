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
import { useAssistant } from '@/stores/assistant.ts'
import { useCalendarStore } from '@/stores/calendar.ts'
import { useDB } from '@/composables/db.ts'
import { useDavStore } from '@/stores/dav.ts'
import { Textarea } from '@/components/ui/textarea'
import { useUserStore } from '@/stores/user.ts'

const userStore = useUserStore()
const { user } = storeToRefs(userStore)

const gptStore = useAssistant()
const { openAi } = storeToRefs(gptStore)

const weatherStore = useWeatherStore()
const { location, weatherApiKey } = storeToRefs(weatherStore)

const calendarStore = useCalendarStore()
const { calendarIcsUrls } = storeToRefs(calendarStore)
const calendarUrlInput = ref<string>('')

const davStore = useDavStore()
const { appleCredentials } = storeToRefs(davStore)

const openAiApiKeyInput = ref<string>(openAi.value.openAiApiKey)
const weatherApiKeyInput = ref<string>(weatherApiKey.value)
const locationInput = ref<string>(location.value)
const appleIdInput = ref<string>(appleCredentials.value.appleId)
const appleAppPasswordInput = ref<string>(appleCredentials.value.appleAppPassword)

function updateOpenAiApiKey() {
  openAi.value.openAiApiKey = openAiApiKeyInput.value
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
</script>

<template>
  <div class="container max-w-2xl mx-auto py-12 px-4">
    <h1 class="text-3xl font-bold mb-6">Einstellungen</h1>

    <div class="space-y-6">
      <!-- Personal Settings Card -->
      <Card>
        <CardHeader class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <Settings class="h-5 w-5 shrink-0" />
            Persönliche Einstellungen
          </CardTitle>
          <CardDescription>
            Personalisiere deine Erfahrung mit der App.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-6">
            <div class="space-y-2">
              <Label for="personalName">Wie möchtest du genannt werden?</Label>
              <Input
                id="personalName"
                v-model="user.name"
                placeholder="Dein Name"
                type="text"
              />
            </div>

            <Separator />

            <div class="space-y-2">
              <Label for="personalInformation">Informationen über dich</Label>
              <Textarea
                id="personalInformation"
                v-model="user.personalInformation"
                placeholder="Stelle persönliche Informationen über dich bereit"
                rows="3"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- OpenAI Settings Card -->
      <Card>
        <CardHeader class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <Settings class="h-5 w-5 shrink-0" />
            OpenAI Einstellungen
          </CardTitle>
          <CardDescription>
            Konfiguriere deine OpenAI API-Verbindung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="updateOpenAiApiKey" class="space-y-4">
            <div class="space-y-2">
              <Label for="openAiApiKey">OpenAI API Schlüssel</Label>
              <div class="flex gap-2">
                <Input
                  id="openAiApiKey"
                  v-model="openAiApiKeyInput"
                  placeholder="Füge einen OpenAI API Key ein"
                  type="password"
                  class="flex-1"
                />
                <Button type="submit" size="sm" class="shrink-0">
                  <Check class="h-4 w-4 mr-2" />
                  Speichern
                </Button>
              </div>
              <p class="text-sm text-muted-foreground">
                Erstelle <a class="underline hover:text-primary transition-colors" href="https://platform.openai.com/api-keys"
                            target="_blank" rel="noreferrer">hier</a> einen OpenAI Schlüssel.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <!-- Weather Settings Card -->
      <Card>
        <CardHeader class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <Cloud class="h-5 w-5 shrink-0" />
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
              <div class="flex gap-2">
                <Input
                  id="location"
                  v-model="locationInput"
                  type="text"
                  placeholder="Für wo möchtest du das Wetter haben?"
                  class="flex-1"
                />
                <Button type="submit" size="sm" class="shrink-0">
                  <Check class="h-4 w-4 mr-2" />
                  Speichern
                </Button>
              </div>
            </form>

            <Separator />

            <!-- Weather API Key Settings -->
            <form @submit.prevent="updateWeatherApiKey" class="space-y-2">
              <Label for="weatherApiKey">Weather API Schlüssel</Label>
              <div class="flex gap-2">
                <Input
                  id="weatherApiKey"
                  v-model="weatherApiKeyInput"
                  type="password"
                  placeholder="Füge einen Weather API Schlüssel ein"
                  class="flex-1"
                />
                <Button type="submit" size="sm" class="shrink-0">
                  <Check class="h-4 w-4 mr-2" />
                  Speichern
                </Button>
              </div>
              <p class="text-sm text-muted-foreground">
                Erstelle <a class="underline hover:text-primary transition-colors" href="https://www.weatherapi.com/my/" target="_blank"
                            rel="noreferrer">hier</a> einen Weather API Schlüssel.
              </p>
            </form>
          </div>
        </CardContent>
      </Card>

      <!-- Apple Card -->
      <!-- <Card>
        <CardHeader class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple"
                 class="h-5 w-5 shrink-0" />
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
              />
            </div>
            <div class="space-y-2">
              <Label for="appleAppPassword">App-spezifisches Passwort</Label>
              <Input
                id="appleAppPassword"
                v-model="appleAppPasswordInput"
                type="password"
                placeholder="App-spezifisches Passwort"
              />
              <p class="text-sm text-muted-foreground">
                Erstelle ein <a class="underline hover:text-primary transition-colors" href="https://appleid.apple.com/account/manage"
                                target="_blank" rel="noreferrer">app-spezifisches Passwort</a> für Drittanbieter-Apps.
              </p>
            </div>
            <Button type="submit" size="sm">
              <Check class="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </form>
        </CardContent>
      </Card> -->

      <!-- ICS Settings Card -->
      <!-- <Card>
        <CardHeader class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <Cloud class="h-5 w-5 shrink-0" />
            Kalender Einstellungen
          </CardTitle>
          <CardDescription>
            Verwalte Kalender für deine Anwendung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-6">
            <form @submit.prevent="addCalendar" class="space-y-2">
              <Label for="calendarUrl">Kalender-URL (ICS)</Label>
              <div class="flex gap-2">
                <Input
                  id="calendarUrl"
                  v-model="calendarUrlInput"
                  type="url"
                  placeholder="Füge eine Kalender-URL (ICS) ein"
                  class="flex-1"
                />
                <Button type="submit" size="sm" class="shrink-0">
                  <Check class="h-4 w-4 mr-2" />
                  Hinzufügen
                </Button>
              </div>
              <p class="text-sm text-muted-foreground">
                Unterstützt öffentliche ICS-Links (z.B. von Google Kalender, Outlook, etc.).
              </p>
            </form>

            <Separator />

            <div v-if="calendarIcsUrls.length > 0" class="space-y-2">
              <Label>Deine Kalender:</Label>
              <ul class="space-y-2">
                <li v-for="url in calendarIcsUrls" :key="url" class="flex items-center justify-between rounded-md border p-2">
                  <span class="text-sm break-all pr-2">{{ url }}</span>
                  <Button variant="destructive" size="sm" class="shrink-0" @click="removeCalendar(url)">
                    Entfernen
                  </Button>
                </li>
              </ul>
            </div>
            <div v-else class="text-sm text-muted-foreground py-2">
              Noch keine Kalender-URLs hinzugefügt.
            </div>
          </div>
        </CardContent>
      </Card> -->

      <!-- Encoded Settings -->
      <Card>
        <CardHeader class="space-y-1">
          <CardTitle class="flex items-center gap-2">
            <Settings class="h-5 w-5 shrink-0" />
            Komprimierte Einstellungen
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div class="space-y-4">
            <div class="rounded-md bg-muted/30 p-3 overflow-x-auto">
              <pre class="text-xs text-muted-foreground whitespace-pre-wrap break-all">{{ dbEncoded }}</pre>
            </div>

            <form @submit.prevent="saveEncodedInput" class="space-y-4">
              <div class="space-y-2">
                <Label for="encodedSettings">Komprimierte Einstellungen</Label>
                <div class="flex gap-2">
                  <Input
                    id="encodedSettings"
                    v-model="dbEncodedInput"
                    placeholder="Füge die komprimierten Einstellungen ein"
                    class="flex-1"
                  />
                  <Button type="submit" size="sm" class="shrink-0">
                    <Check class="h-4 w-4 mr-2" />
                    Speichern
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
