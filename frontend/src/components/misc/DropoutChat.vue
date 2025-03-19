<template>
	<div id="chat-container">
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
			<div id="chat-messages">
				<textarea
					v-model="chatMessages"
					readonly
				/>
				<!-- Chat messages will appear here -->
			</div>
			<input
				v-model="chatInput"
				type="text"
				placeholder="Type a message..."
				style="width: 100%"
				@keyup.enter="handleChatInput"
			>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import axios from 'axios'
import { OPENAI_API_KEY } from '../../open-ai.config.js'

const isChatOpen = ref(false)
const chatInput = ref('')
const chatMessages = ref('')

const systemPrompt = 'From the following code identify the the elements the user is trying to identify. Return in json format with the class, tags and textContent of the elements that needs to be highlighted.\n\nOnly return in exactly the format as below\n{\n    class: "task-container",\n    tag: "a",\n    textContent: "as",\n}'

const toggleChat = () => {
	isChatOpen.value = !isChatOpen.value
}

const handleChatInput = async () => {
	const userMessage = chatInput.value
	chatMessages.value += `\nUser: ${userMessage}`
	chatInput.value = ''

	try {
		const response = await axios.post('https://api.openai.com/v1/responses', {
			model: 'gpt-4o-mini',
			input: [
				{
					role: 'system',
					content: [
						{
							type: 'input_text',
							text: systemPrompt,
						},
					],
				},
				{
					role: 'user',
					content: [
						{
							type: 'input_text',
							text: userMessage,
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
	} catch (error) {
		console.error('Error fetching AI response:', error)
	}
}
</script>

<style scoped>
#chat-container {
	position: fixed;
	bottom: 10px;
	right: 10px;
	width: 300px;
	background: white;
	border: 1px solid #ccc;
	border-radius: 5px;
	z-index: 9999;
}

#chat-header {
	background: #007bff;
	color: white;
	padding: 10px;
	cursor: pointer;
	text-align: center;
}

#chat-content {
	padding: 10px;
}

textarea {
	width: 100%;
	height: 100px;
	resize: none;
	border: 1px solid #ccc;
	padding: 5px;
	background: #f9f9f9;
}
</style>