<template>
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


function removeButtonByText(text) {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (button.textContent.trim() === text) {
            button.remove();
            console.log(`Button with text "${text}" removed.`);
        }
    });
}




// onMounted(() => {
// 	document.body.style.backgroundColor = 'black';
// 	// Function to add a "Hello World" text box at the top of the page
// 	function addHelloWorld() {
// 		// Create a new div element
// 		const helloWorldDiv = document.createElement('div');

// 		// Set the text content
// 		helloWorldDiv.textContent = 'Hello Wor';

// 		// Apply styles to make the text big
// 		helloWorldDiv.style.fontSize = '3em'; // Adjust the size as needed
// 		helloWorldDiv.style.fontWeight = 'bold';
// 		helloWorldDiv.style.textAlign = 'center';
// 		helloWorldDiv.style.margin = '20px 0';

// 		// Insert the new element at the top of the body
// 		document.body.prepend(helloWorldDiv);
// 	}

// 	// Call the function to add the text box
// 	addHelloWorld();

	
//     setTimeout(() => {
//         // Call the function to remove the button
//         removeButtonByText('Select a date range');
//     }, 100); // Adjust the delay as needed

// 	// Watch for route changes

// });

// watch(route, () => {
//     setTimeout(() => {
//         // Call the function to remove the button
//         removeButtonByText('Select a date range');
//     }, 100); // Adjust the delay as needed

// });

</script>


<style lang="scss" src="@/styles/global.scss" />

<!-- <style scoped>
.highlight {
    background-color: red;
    color: white; /* Optional: change text color for better contrast */
}
</style> -->