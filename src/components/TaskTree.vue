<template>
<div>
	<q-tree
		:nodes="lazy"
		node-key="label"
		label-key="label"
		children-key="children"
		@lazy-load="onLazyLoad"
	/>
</div>
</template>

<script>
import { ref } from 'vue'
//const nodes =
export default {
	setup() {
		return {
			lazy: ref(simple),
			onLazyLoad({ node, key, done, fail }) {
				setTimeout(() => {
					if(key.indexOf('Lazy load empty') > -1) {
						done([])
						return
					}
					const label = node.label
					done(node.children)
				}, 1000)
			},
			simple: [
		        {
					label: 'Satisfied customers (with avatar)',
					avatar: 'https://cdn.quasar.dev/img/boy-avatar.png',
					children: [
						{
							label: 'Good food (with icon)',
							icon: 'restaurant_menu',
							children: [
								{ label: 'Quality ingredients' },
								{ label: 'Good recipe' }
							]
						},
						{
							label: 'Good service (disabled node with icon)',
							icon: 'room_service',
							disabled: true,
							children: [
								{ label: 'Prompt attention' },
								{ label: 'Professional waiter' }
							]
						},
						{
							label: 'Pleasant surroundings (with icon)',
							icon: 'photo',
							children: [
								{
									label: 'Happy atmosphere (with image)',
									img: 'https://cdn.quasar.dev/img/logo_calendar_128px.png'
								},
								{ label: 'Good table presentation' },
								{ label: 'Pleasing decor' }
							]
						}
					]
				}
			]
		}
	}
}
</script>
