<template>
	<div
		id="chat-container"
		:style="chatContainerStyle"
	>
		<div
			id="chat-header"
			@click="toggleChat"
		>
			Chat
			<button id="wand-button" @click="clickRedBoxedElements">
				🪄
			</button>
		</div>
		<div
			v-if="isChatOpen"
			id="chat-content"
		>
			<div
				id="chat-messages"
				:style="messageContainerStyle"
			>
				<textarea
					v-model="chatMessages"
					readonly
				/>
				<!-- Chat messages will appear here -->
			</div>
			<div id="chat-input-container">
				<textarea
					v-model="chatInput"
					placeholder="Type a message..."
				/>
				<button @click="handleChatInput">
					Send
				</button>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import { cleanHtmlText } from '../../../../htmlCleaner/text_cleaner.js'
import { OPENAI_API_KEY } from '../../open-ai.config.js'
import { system_prompt } from './DropoutChat.config.js'

const isChatOpen = ref(false)
const isExpanded = ref(false)
const chatInput = ref('')
const chatMessages = ref('')

const chatContainerStyle = computed(() => ({
	width: isExpanded.value ? '500px' : '300px',
	height: isExpanded.value ? '500px' : 'auto',
}))

const messageContainerStyle = computed(() => ({
	flex: '1',
	overflowY: 'auto',
}))

const toggleChat = () => {
	isChatOpen.value = !isChatOpen.value
}

const handleChatInput = async () => {
	const userMessage = chatInput.value
	chatMessages.value += `\nUser: ${userMessage}`
	chatInput.value = ''

	const element = document.documentElement 
	const cleanedHtml = cleanHtmlText(element)
	console.log(cleanedHtml)

	try {
		const response = await axios.post('https://api.openai.com/v1/responses', {
			model: 'gpt-4o-mini',
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
							text: `${cleanedHtml}\n${userMessage}`,
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

		const redBoxes = document.querySelectorAll('.red-box');
		redBoxes.forEach(box => {
			box.classList.remove('red-box');
		});

		const aiResponse = response.data.output[0].content[0].text
		chatMessages.value += `\nAI: ${aiResponse}`

		const startIndex = aiResponse.indexOf('[');
		const endIndex = aiResponse.lastIndexOf(']');
		
		const jsonResponse = aiResponse.substring(startIndex, endIndex + 1);
		const jsonList = JSON.parse(jsonResponse);
		jsonList.forEach((jsonItem: string) => {
			const cleanedItem = JSON.stringify(jsonItem).replace(/[`]/g, '').replace(/json/g, '').trim();
			highlightElement(cleanedItem);
		});


	} catch (error) {
		console.error('Error fetching AI response:', error)
	}
}

function highlightElement(cleanedResponse: string) {
	console.log(cleanedResponse)
	try {
		// Parse the cleaned response
		const parsedResponse = JSON.parse(cleanedResponse)
		// Extract the necessary information
		const { attributes, tag, textContent } = parsedResponse;
		console.log(attributes, tag, textContent)
		let attributeSelectors = '';

		// Check if attributes is an object
		if (typeof attributes === 'object' && attributes !== null) {
			attributeSelectors = Object.entries(attributes)
				.map(([key, value]) => {
					if (key === 'class' && value.trim() !== '') {
						// Handle multiple classes
						return value.split(' ').map((cls: string) => `.${cls}`).join('');
					} else if (key !== 'class') {
						return `[${key}="${value}"]`;
					}
					return ''; // Return an empty string if class is empty
				})
				.join('');
		} else {
			console.warn('Attributes is not an object:', attributes);
		}

		console.log("Attribute Selectors")
		console.log(attributeSelectors)

		const selector = `${tag}${attributeSelectors}`;
		console.log("Selector")
		console.log(selector)

		// Find elements that match the text content
		let matchingElements = Array.from(document.querySelectorAll('*')).filter(element => {
			return element.textContent?.trim() === textContent;
		});

		// If no elements match the text content, select all elements with the tag
		if (matchingElements.length === 0 || !textContent.trim())  {
			matchingElements = Array.from(document.querySelectorAll(tag));
		}

		// Split the selector into individual selectors
		const individualSelectors = selector.split(/(?=\[)|(?=\.)/);

		// Filter elements by each selector one at a time
		individualSelectors.forEach(sel => {
			if (matchingElements.length > 1) {
				const previousMatchingElements = [...matchingElements];
				matchingElements = matchingElements.filter(element => element.matches(`${tag}${sel}`));
				// If filtering results in no elements, revert to the previous state
				if (matchingElements.length === 0) {
					matchingElements = previousMatchingElements;
				}
			}
		});
		if (matchingElements.length > 1) {
			matchingElements = [matchingElements[0]];
		}

		// Highlight the matching elements, can be 0 or 1
		matchingElements.forEach(element => {
			element.classList.add('red-box');
			console.log(`Element with text "${textContent}" highlighted.`);
		});

	} catch (error) {
		console.error('Failed to parse AI response:', error)
	}
}

const clickRedBoxedElements = () => {
	const redBoxedElements = document.querySelectorAll('.red-box');
	redBoxedElements.forEach(element => {
		(element as HTMLElement).click();
	});
};
</script>

<style scoped>
#chat-container {
	position: fixed;
	bottom: 10px;
	right: 10px;
	background: white;
	border: 1px solid #ccc;
	border-radius: 5px;
	z-index: 9999;
	transition: width 0.3s ease, height 0.3s ease;
	display: flex;
	flex-direction: column;
}

#chat-header {
	background: #007bff;
	color: white;
	padding: 10px;
	cursor: pointer;
	text-align: center;
	display: flex;
	justify-content: space-between;
	align-items: center;
	position: relative;
}

#chat-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: 10px;
}

#chat-messages {
	flex: 1;
	width: 100%;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
}

#chat-messages textarea{
	min-height: 400px;
	resize: none;
}

#chat-input-container {
	display: flex;
	gap: 5px;
	align-items: center;
}

#chat-input-container textarea {
	flex: 1;
	height: 50px;
	resize: none;
	border: 1px solid #ccc;
	padding: 5px;
	background: #f9f9f9;
}

.red-box {
	border: 3px solid red !important;
	/* Ensure the border is applied */
	padding: 5px !important;
	/* Ensure padding is applied */
	z-index: 1000 !important;
	/* Ensure it appears above other elements */
}

#chat-input-container button {
	width: 80px;
	background-color: #007bff;
	color: white;
	border: none;
	padding: 10px;
	cursor: pointer;
	border-radius: 5px;
}

#wand-button {
	position: absolute;
	right: 10px;
	top: 10px;
	background: transparent;
	border: none;
	cursor: pointer;
	font-size: 20px;
}
</style>
