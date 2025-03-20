<template>
	<div
		id="chat-container"
	>
		<div
			id="chat-header"
			@click="toggleChat"
		>
			Chat
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
const chatInput = ref('')
const chatMessages = ref('')

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
			max_output_tokens: 150,
			top_p: 1,
			store: true,
		}, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${OPENAI_API_KEY}`,
			},
		})

		const aiResponse = response.data.output[0].content[0].text
		chatMessages.value += `\nAI: ${aiResponse}`
		highlightElement(aiResponse)
	} catch (error) {
		console.error('Error fetching AI response:', error)
	}
}

function highlightElement(aiResponse: string) {
	const cleanedResponse = aiResponse.replace(/[`]/g, '').replace(/json/g, '').trim()
	console.log(cleanedResponse)
	try {
		// Parse the cleaned response
		const { class: className, textContent } = JSON.parse(cleanedResponse)
		console.log(className, textContent)

		// Find elements with the specified class
		const selector = className.split(' ').map((cls: string) => `.${cls}`).join('')
		const elements = document.querySelectorAll(selector)
		elements.forEach(element => {
			// Check if the element's text content matches
			if (element.textContent?.trim() === textContent) {
				element.classList.add('red-box')
				console.log(`Element with class "${className}" and text "${textContent}" highlighted.`)
			}
		})
	} catch (error) {
		console.error('Failed to parse AI response:', error)
	}
}
</script>

<style scoped>
#chat-container {
	width: 500px;
	height: 500px;
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
}

#resize-button {
	background: transparent;
	border: none;
	color: white;
	cursor: pointer;
	font-size: 16px;
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
</style>
