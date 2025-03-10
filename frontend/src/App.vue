<template>
	<div id="chat-container">
    <div id="chat-header" @click="toggleChat">
      Chat
    </div>
    <div v-if="isChatOpen" id="chat-content">
      <div id="chat-messages">
        <!-- Chat messages will appear here -->
      </div>
      <input
        type="text"
        v-model="chatInput"
        @keyup.enter="handleChatInput"
        placeholder="Type a message..."
      />
    </div>
  </div>
	<Ready>
		<template v-if="authStore.authUser">
			<AppHeader />
			<ContentAuth />
		</template>
		<ContentLinkShare v-else-if="authStore.authLinkShare" />
		<NoAuthWrapper
			v-else
			show-api-config
		>
			<RouterView />
		</NoAuthWrapper>
		
		<KeyboardShortcuts v-if="keyboardShortcutsActive" />
		
		<Teleport to="body">
			<AddToHomeScreen />
			<UpdateNotification />
			<Notification />
			<DemoMode />
		</Teleport>
	</Ready>
</template>

<script lang="ts" setup>
import {computed, watch} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import isTouchDevice from 'is-touch-device'

import Notification from '@/components/misc/Notification.vue'
import UpdateNotification from '@/components/home/UpdateNotification.vue'
import KeyboardShortcuts from '@/components/misc/keyboard-shortcuts/index.vue'

import AppHeader from '@/components/home/AppHeader.vue'
import ContentAuth from '@/components/home/ContentAuth.vue'
import ContentLinkShare from '@/components/home/ContentLinkShare.vue'
import NoAuthWrapper from '@/components/misc/NoAuthWrapper.vue'
import Ready from '@/components/misc/Ready.vue'

import {setLanguage} from '@/i18n'

import {useAuthStore} from '@/stores/auth'
import {useBaseStore} from '@/stores/base'

import {useColorScheme} from '@/composables/useColorScheme'
import {useBodyClass} from '@/composables/useBodyClass'
import AddToHomeScreen from '@/components/home/AddToHomeScreen.vue'
import DemoMode from '@/components/home/DemoMode.vue'

const importAccountDeleteService = () => import('@/services/accountDelete')
import {success} from '@/message'

const authStore = useAuthStore()
const baseStore = useBaseStore()

const router = useRouter()
const route = useRoute()

useBodyClass('is-touch', isTouchDevice())
const keyboardShortcutsActive = computed(() => baseStore.keyboardShortcutsActive)

const {t} = useI18n({useScope: 'global'})

// setup account deletion verification
const accountDeletionConfirm = computed(() => route.query?.accountDeletionConfirm as (string | undefined))
watch(accountDeletionConfirm, async (accountDeletionConfirm) => {
	if (accountDeletionConfirm === undefined) {
		return
	}

	const AccountDeleteService = (await importAccountDeleteService()).default
	const accountDeletionService = new AccountDeleteService()
	await accountDeletionService.confirm(accountDeletionConfirm)
	success({message: t('user.deletion.confirmSuccess')})
	authStore.refreshUserInfo()
}, { immediate: true })

// setup password reset redirect
const userPasswordReset = computed(() => route.query?.userPasswordReset as (string | undefined))
watch(userPasswordReset, (userPasswordReset) => {
	if (userPasswordReset === undefined) {
		return
	}

	localStorage.setItem('passwordResetToken', userPasswordReset)
	router.push({name: 'user.password-reset.reset'})
}, { immediate: true })

// setup email verification redirect
const userEmailConfirm = computed(() => route.query?.userEmailConfirm as (string | undefined))
watch(userEmailConfirm, (userEmailConfirm) => {
	if (userEmailConfirm === undefined) {
		return
	}

	localStorage.setItem('emailConfirmToken', userEmailConfirm)
	router.push({name: 'user.login'})
}, { immediate: true })

setLanguage(authStore.settings.language)
useColorScheme()

import { onMounted, nextTick } from 'vue';




import { ref } from 'vue';

const isChatOpen = ref(true);
const chatInput = ref('');

function toggleChat() {
  isChatOpen.value = !isChatOpen.value;
}

function removeButtonByText(text) {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (button.textContent.trim() === text) {
            button.remove();
            console.log(`Button with text "${text}" removed.`);
        }
    });
}

function handleChatInput() {
	addRedBoxByText(chatInput.value.trim());
	chatInput.value = ''; // Clear the input after handling
}

// function highlightElementByText(text) {
//   const elements = document.querySelectorAll('*');
//   elements.forEach(element => {
//     if (element.textContent.trim() === text) {
//       element.classList.add('highlight');
//       console.log(`Element with text "${text}" highlighted.`);
//     }
//   });
// }

function addRedBoxByText(text) {
  const elements = document.querySelectorAll('*');
  elements.forEach(element => {
    if (element.textContent.trim() === text) {
      element.classList.add('red-box');
      console.log(`Element with text "${text}" given a red box.`);
    }
  });
}

onMounted(() => {
	document.body.style.backgroundColor = 'black';
	
    // setTimeout(() => {
    //     // Call the function to remove the button
    //     removeButtonByText('Select a date range');
    // }, 100); // Adjust the delay as needed

	// Watch for route changes

});

watch(route, () => {
    // setTimeout(() => {
    //     // Call the function to remove the button
    //     removeButtonByText('Select a date range');
    // }, 100); // Adjust the delay as needed

});

</script>


<style lang="scss" src="@/styles/global.scss" />

<style scoped>
#chat-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 300px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  background-color: white;
  z-index: 1000; /* Set a high z-index to bring it to the front */
}

#chat-header {
  background-color: #007bff;
  color: white;
  padding: 10px;
  cursor: pointer;
  text-align: center;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}

#chat-content {
  padding: 10px;
}

#chat-messages {
  height: 150px;
  overflow-y: auto;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  padding: 5px;
}

input[type="text"] {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

/* .red-box {
  border: 3px solid red !important; 
  padding: 5px; 
  z-index: 1000; 
} */

</style>