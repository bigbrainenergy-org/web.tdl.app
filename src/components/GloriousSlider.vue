<template>
  <q-item class="q-my-sm">
    <q-item-section v-if="typeof props.beginIcon !== 'undefined'" side>
      <q-icon :name="props.beginIcon" />
    </q-item-section>

    <q-item-section>
      <div>
        <q-slider
          v-model="val"
          :min="props.min"
          :max="props.max"
          :step="props.step"
          label
          label-always
          :label-value="label"
          :color="props.color"
          @change="emit('change', val)"
        />
      </div>
    </q-item-section>

    <q-item-section v-if="typeof props.endIcon !== 'undefined'" side>
      <q-icon :name="props.endIcon" />
    </q-item-section>
  </q-item>
</template>
<script setup lang="ts">
  import { GloriousSliderProp } from 'src/glorious'
  import { computed } from 'vue'
  import { withDefaults } from 'vue'

  const props = withDefaults(defineProps<GloriousSliderProp>(), {
    beginIcon: undefined,
    endIcon: undefined,
    min: 0,
    max: 100,
    step: 1,
    cuteName: undefined,
    unit: undefined,
    color: 'primary'
  })
  const val = defineModel<number>()
  const emit = defineEmits(['change'])
  const cuteNamePortion = computed(() =>
    typeof props.cuteName === 'undefined' ? '' : props.cuteName
  )
  const unitPortion = computed(() => (typeof props.unit === 'undefined' ? '' : ` ${props.unit}`))
  const label = computed(() => `${cuteNamePortion.value} ${val.value}${unitPortion.value}`)
</script>
