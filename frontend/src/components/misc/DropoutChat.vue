<template>
	<div
		v-if="active"
	>
		<div
			v-if="!showInstruction"
			class="instruction-container"
		>
			<BaseButton
				v-if="!isLoadingInstructions"
				class="direction-button"
			>
				<Petasos class="icon" />
			</BaseButton>
			<Icon
				v-if="isLoadingInstructions"
				class="direction-button"
				icon="hourglass-half"
			/>
			<div
				v-if="isInputOpen"
				class="query-container"
			>
				<input
					v-model="queryInput"
					type="text"
					placeholder="What would you like to do..."
				>
				<BaseButton
					class="direction-button"
					@click="handleChatInput"
				>
					<Icon icon="arrow-right" />
				</BaseButton>
			</div>
		</div>
		<div
			v-if="showInstruction"
			class="instruction-container"
		>
			<BaseButton
				v-if="instructionStep > 0"
				class="direction-button"
				@click="showPrevInstruction"
			>
				<Icon icon="angle-left" />
			</BaseButton>
			<BaseButton
				v-if="showDemo"
				class="direction-button"
				@click="closeDropoutChat"
			>
				<Icon icon="x" />
			</BaseButton>
			<p>
				{{ currentInstruction }}
			</p>
			<BaseButton
				class="direction-button"
				@click="clickRedBoxedElements"
			>
				<Talia class="icon" />
			</BaseButton>
			<BaseButton
				v-if="!isLastInstructionStep"
				class="direction-button"
				@click="showNextInstruction"
			>
				<Icon icon="angle-right" />
			</BaseButton>
			<BaseButton
				v-if="isLastInstructionStep && !showDemo"
				class="direction-button"
				@click="showNextInstruction"
			>
				<Icon icon="check" />
			</BaseButton>
		</div>
	</div>
	<BaseButton
		v-if="false"
		class="download-button"
		@click="downloadAccumulatedData"
	>
		Download Data
	</BaseButton>
</template>

<script lang="ts" setup>
import Talia from '@/assets/Talia_DVXI.svg?component'
import Petasos from '@/assets/Petasos_DVXI.svg?component'

import { ref, computed, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import BaseButton from '@/components/base/BaseButton.vue'

import axios from 'axios'
import { cleanHtmlText, extractTextContent } from '../../../../htmlCleaner/text_cleaner.js'
import { OPENAI_API_KEY } from '../../open-ai.config.js'
import { system_prompt, other_pages_prompt, saved_pages_prompt, additional_other_pages_prompt } from './DropoutChat.config.js'
import { useBaseStore } from '@/stores/base.js'

const route = useRoute()

const currentRouteUrl = ref(route.fullPath)

const baseStore = useBaseStore()

const active = computed(() => baseStore.dropoutChatActive)

const showDemo = computed(() => baseStore.dropoutChatShowDemo)

watchEffect(() => {
	if (!active.value) {
		// DO NOTHING FOR NOW
	}
	if (showDemo.value) {
		instructionSet = [
			{
				instruction: 'A new feature was added to make adding labels easier and quicker!',
				attributes: {
					class: 'red-box',
					id: 'demo-instruction',
				},
				tag: 'div',
				textContent: 'Click here to see the instruction.',
			},
		]
		
		instructionStep.value = 0
		currentInstruction.value = instructionSet[0].instruction
		showInstruction.value = true
	}
})

function closeDropoutChat() {
	baseStore.setDropoutChatActive(false)
}

watch(route, (newRoute) => {
    const element = document.documentElement
    const extractedText = extractTextContent(element)
    const pageUrl = currentRouteUrl.value

	console.log(extractedText)
	console.log('Page URL')
	console.log(pageUrl)

    // Save the extracted text and URL of the current page
    savePageData(pageUrl, extractedText)

    // Update the current route URL to the new route
    currentRouteUrl.value = newRoute.fullPath
	console.log('New Route URL')
	console.log(currentRouteUrl.value)


	// if (showInstruction.value && instructionStep.value < instructionSet.length - 1) {
	// 	queryInput.value = previousQueryInput.value
    //     instructionStep.value = -1 // Disrupt the current step
    //     handleChatInput() // Re-ask the same query
    // }
})

// Object to accumulate data
const accumulatedData = ref<Record<string, string>>({})

// Function to save page data
function savePageData(url: string, extractedText: string) {
	const storageKey = 'pageData'
	const storedData = localStorage.getItem(storageKey)
	const pageData = storedData ? JSON.parse(storedData) : {}

	// Update or add the cleaned HTML for the current URL
	pageData[url] = extractedText

	// Save the updated data back to local storage
	localStorage.setItem(storageKey, JSON.stringify(pageData))
	// console.log(`Data saved for URL: ${url}`)

	// Append data to the accumulatedData object
	accumulatedData.value[url] = extractedText
}

// Function to download the accumulated data
function downloadAccumulatedData() {
	let dataToSave = ''
	for (const [url, text] of Object.entries(accumulatedData.value)) {
		dataToSave += `URL: ${url}\n${text}\n---\n`
	}

	// Create a Blob from the data
	const blob = new Blob([dataToSave], { type: 'text/plain' })

	// Create a link element
	const link = document.createElement('a')
	link.href = URL.createObjectURL(blob)
	link.download = 'dropoutsavedpages.txt'

	// Append the link to the body
	document.body.appendChild(link)

	// Programmatically click the link to trigger the download
	link.click()

	// Clean up by removing the link
	document.body.removeChild(link)
}

const queryInput = ref('')
const previousQueryInput = ref('')

const isInputOpen = ref(true)
const showInstruction = ref(false)
const currentInstruction = ref('')
const instructionStep = ref(0)

const isLoadingInstructions = ref(false)
const isLastInstructionStep = computed(() => instructionStep.value == instructionSet.length - 1)

let instructionSet: []

const toggleInput = () => {
	isInputOpen.value = !isInputOpen.value
}

const handleChatInput = async () => {
	if (queryInput.value !== '') {
		toggleInput()
		await askOpenAI(queryInput.value)
		queryInput.value = ''
	}
}

async function askOpenAI(query: string) {
	isLoadingInstructions.value = true

	console.log(`Query: ${query}`)
	
	previousQueryInput.value = query

	const element = document.documentElement
	const cleanedHtml = cleanHtmlText(element)
	console.log(cleanedHtml)

	try {
		const response = await axios.post('https://api.openai.com/v1/responses', {
			model: 'gpt-4o',
			input: [
				{
					role: 'system',
					content: [
						{
							type: 'input_text',
							text: system_prompt,
						},
					],
				},
				{
					role: 'user',
					content: [
						{
							type: 'input_text',
							text: `${saved_pages_prompt}\n${cleanedHtml}\n${query}\n\n${additional_other_pages_prompt}`,
						},
					],
				},
			],
			text: {
				format: {
					type: 'text',
				},
			},
			reasoning: {},
			tools: [],
			temperature: 1,
			max_output_tokens: 1000,
			top_p: 1,
			store: true,
		}, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${OPENAI_API_KEY}`,
			},
		})

		isLoadingInstructions.value = false
		const aiResponse = response.data.output[0].content[0].text
		console.log(`Response from OpenAI: ${aiResponse}`)

		const startIndex = aiResponse.indexOf('[')
		const endIndex = aiResponse.lastIndexOf(']')

		const jsonResponse = aiResponse.substring(startIndex, endIndex + 1)

		instructionSet = JSON.parse(jsonResponse)
		instructionStep.value = -1
		showNextInstruction()
		showInstruction.value = true

	} catch (error) {
		console.error('Error fetching AI response:', error)
	}
}

function showPrevInstruction() {
	showInstructionIn(-1)
}
function showNextInstruction() {
	showInstructionIn(1)
}

function showInstructionIn(direction:number) {
	clearHighlightElement()

	if (instructionSet.length == instructionStep.value+direction) {
		showInstruction.value = false
		baseStore.setDropoutChatActive(false)
	} else {
		console.log('Showing instruction...')
		instructionStep.value+=direction

		const step = instructionSet[instructionStep.value]
		
		console.log(`Showing - ${step}`)
		const cleanedItem = JSON.stringify(step).replace(/[`]/g, '').replace(/json/g, '').replace(/'/g, '').trim()
		highlightElement(cleanedItem)
	}
}

function clearHighlightElement() {
	const redBoxes = document.querySelectorAll('.red-box')
	redBoxes.forEach(box => {
		box.classList.remove('red-box')
	})
}

function highlightElement(cleanedResponse: string) {
	console.log(cleanedResponse)
	try {
		// Parse the cleaned response
		const parsedResponse = JSON.parse(cleanedResponse)
		// Extract the necessary information
		const { instruction, attributes, tag, textContent, textInput } = parsedResponse
		console.log(instruction, attributes, tag, textContent, textInput)

		currentInstruction.value = instruction

		let attributeSelectors = ''

		// Check if attributes is an object
		if (typeof attributes === 'object' && attributes !== null) {
			attributeSelectors = Object.entries(attributes)
				.map(([key, value]) => {
					if (key === 'class' && value.trim() !== '') {
						// Handle multiple classes
						return value.split(' ').map((cls: string) => `.${cls}`).join('')
					} else if (key !== 'class') {
						return `[${key}="${value}"]`
					}
					return '' // Return an empty string if class is empty
				})
				.join('')
		} else {
			console.warn('Attributes is not an object:', attributes)
		}

		console.log('Attribute Selectors')
		console.log(attributeSelectors)

		const selector = `${tag}${attributeSelectors}`
		console.log('Selector')
		console.log(selector)

		// Find elements that match the text content
		let matchingElements = Array.from(document.querySelectorAll('*')).filter(element => {
			return element.textContent?.trim() === textContent
		})

		if (matchingElements.length === 0) {
			// If no elements match the exact text content, try partial matching
			const textContentWords = textContent.trim().split(/\s+/)
			matchingElements = Array.from(document.querySelectorAll('*')).filter(element => {
				const elementText = element.textContent?.trim() || ''
				return textContentWords.some(word => elementText.includes(word))
			})
			if (matchingElements.length > 1) {
				matchingElements = []
			}
		}

		// If no elements match the text content, select all elements with the tag
		if (!textContent.trim())  {
			matchingElements = Array.from(document.querySelectorAll(tag))
		}

		// Split the selector into individual selectors
		const individualSelectors = selector.split(/(?=\[)|(?=\.)/)

		// Filter elements by each selector one at a time
		individualSelectors.forEach(sel => {
			try {
				if (matchingElements.length > 1) {
					const previousMatchingElements = [...matchingElements]
					matchingElements = matchingElements.filter(element => element.matches(`${tag}${sel}`))
					// If filtering results in no elements, revert to the previous state
					if (matchingElements.length === 0) {
						matchingElements = previousMatchingElements
					}
				}
			} catch (error) {
				console.error(`Invalid selector: ${sel}`, error)
			}
		})
		if (matchingElements.length > 1) {
			matchingElements = [matchingElements[0]]
		}

		// Highlight the matching elements, can be 0 or 1
		matchingElements.forEach(element => {
			element.classList.add('red-box')
			// Store the textInput value as a data attribute if it exists
			if (textInput) {
				element.setAttribute('data-text-input', textInput)
			}
			console.log(`Element with text "${textContent}" highlighted.`)
		})

	} catch (error) {
		console.error('Failed to parse AI response:', error)
	}
}

const clickRedBoxedElements = () => {
	if (showDemo.value) {
		baseStore.setDropoutChatShowDemo(false)
		showInstruction.value = false
		isInputOpen.value = false
		askOpenAI('Using "Quick Add Magic", when creating a task, you can use special keywords to directly add attributes to the newly created task. This allows to add commonly used attributes to tasks much faster. To add a label, simply prefix the name of the label with *. Vikunja will first check if the label already exist and create it if not. You can use this multiple times. To use spaces, simply add a " or \' around the label name. For example: *"Label with spaces". ' + 'In two steps, show me how to add task with label. Don\'t show me where to add task, explian the syntax for adding a label with the task and then just show where to click to add the new task.')
	} else {
		const redBoxedElements = document.querySelectorAll('.red-box')
		console.log('Found red-boxed elements:', redBoxedElements.length)
		
		redBoxedElements.forEach((element) => {
			// Get the current instruction from the instruction set
			const currentStep = instructionSet[instructionStep.value]
			console.log('Current step:', currentStep)
			console.log('Instruction set:', instructionSet)
			console.log('Current step index:', instructionStep.value)
			
			// Check if the current step has textInput
			if (currentStep && 'textInput' in currentStep && currentStep.textInput) {
				console.log('Found textInput:', currentStep.textInput)
				
				// If the element itself is an input or textarea
				if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
					console.log('Direct input/textarea found')
					element.value = currentStep.textInput
					// Create and dispatch input event
					const inputEvent = new Event('input', { bubbles: true, cancelable: true })
					element.dispatchEvent(inputEvent)
					// Create and dispatch change event
					const changeEvent = new Event('change', { bubbles: true, cancelable: true })
					element.dispatchEvent(changeEvent)
					// Force focus and blur to trigger any bound events
					element.focus()
					element.blur()
				} else {
					// Look for a form under the red-box element
					const form = element.querySelector('form')
					console.log('Form found:', form)
					
					if (form) {
						// Find the first input or textarea in the form
						const input = form.querySelector('input, textarea')
						if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
							console.log('Setting value for input:', input)
							input.value = currentStep.textInput
							// Create and dispatch input event
							const inputEvent = new Event('input', { bubbles: true, cancelable: true })
							input.dispatchEvent(inputEvent)
							// Create and dispatch change event
							const changeEvent = new Event('change', { bubbles: true, cancelable: true })
							input.dispatchEvent(changeEvent)
							// Force focus and blur to trigger any bound events
							input.focus()
							input.blur()
						}
					} else {
						// If no form found, look for the first input/textarea in the element's children
						const input = element.querySelector('input, textarea')
						if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
							console.log('Setting value for input:', input)
							input.value = currentStep.textInput
							// Create and dispatch input event
							const inputEvent = new Event('input', { bubbles: true, cancelable: true })
							input.dispatchEvent(inputEvent)
							// Create and dispatch change event
							const changeEvent = new Event('change', { bubbles: true, cancelable: true })
							input.dispatchEvent(changeEvent)
							// Force focus and blur to trigger any bound events
							input.focus()
							input.blur()
						}
					}
				}
			} else {
				// If no textInput, just click the element
				console.log('No textInput found, clicking element')
				if (element instanceof HTMLElement) {
					element.click()
				}
			}
		})
	}
}
</script>

<style lang="scss" scoped>
.icon{
	height: 2em; width: auto;
}

.instruction-container {
	position: fixed;
	// FIXME: We should prevent usage of z-index or
	// at least define it centrally
	// the highest z-index of a modal is .hint-modal with 4500
	z-index: 5000;
	bottom: 6rem;
	inset-inline: 1rem;
	max-width: max-content;
	margin-inline: auto;

	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: .5rem 1rem;
	background: var(--grey-900);
	border-radius: $radius;
	font-size: .9rem;
	color: #c7a253;
}

.query-container input[type=text] {
  background: var(--grey-900);
  box-sizing: border-box;
  border: none;
  border-bottom: 2px solid #c7a253;
  font-size: 14px;
  width: 300px;
}

.direction-button {
	padding: .25rem .5rem;
	cursor: pointer;
}

.download-button {
	padding: .5rem 1rem;
	cursor: pointer;
	background-color: var(--primary-color);
	color: white;
	border-radius: $radius;
	margin-top: 1rem;
	z-index: 6000;
	position: relative;
}
</style>