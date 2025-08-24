<script setup>
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  // const script = document.createElement('script')
  // script.src = 'https://demo-team.us.ainiro.io/magic/system/openai/include-chatbot.js?rtl=false&clear_button=false&follow_up=true&copyButton=false&new_tab=false&code=false&references=false&position=right&type=npgsqlrest_github_io&header=Ask%20about%20our%20services%20or%20products&popup=&button=AI%20Chatbot&placeholder=Ask%20me%20anything%20...&color=%23fefefe&start=%237892e5&end=%23142660&link=%23fe8464&theme=modern-square'
  // script.defer = true
  // script.id = 'ainiro-chatbot-script'
  // document.body.appendChild(script)
})

onUnmounted(() => {
  // // Clean up script
  // const script = document.getElementById('ainiro-chatbot-script')
  // if (script) script.remove()

  // // Clean up any chatbot elements the script may have created
  // const chatbotElements = document.querySelectorAll('[class*="ainiro"], [id*="ainiro"], [class*="chatbot"]')
  // chatbotElements.forEach(el => el.remove())
})
</script>

<template>
  <!-- Chatbot injects its own UI -->
</template>
