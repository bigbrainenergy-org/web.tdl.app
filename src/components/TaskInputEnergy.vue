<template>
  <q-expansion-item
    v-model="expandEnergyStats"
    expand-separator
    switch-toggle-side
    icon="fas fa-lightbulb"
    caption="Metadata"
  >
    <br>
    <GloriousSlider
      v-for="(s, key) of sliders"
      :key="key"
      v-model="s.modelRef.value"
      v-bind="s"
      @change="s.updateFunc"
    />
  </q-expansion-item>
</template>

<script setup lang="ts">
  import GloriousSlider from 'src/components/GloriousSlider.vue'

  import { updateTask } from 'src/utils/task-utils'
  import { storeToRefs } from 'pinia'
  import { GloriousSliderConfig } from 'src/utils/glorious-utils'
  import { ref } from 'vue'
  import { Task } from 'src/stores/tasks/task-model'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'

  const task = defineModel<Task>('task', { required: true })

  const localSettingsStore = useLocalSettingsStore()

  const { expandEnergyStats } = storeToRefs(localSettingsStore)

  const editMentalEnergyRequired = ref(task.value.mental_energy_required)
  const editPhysicalEnergyRequired = ref(task.value.physical_energy_required)

  const sliders: GloriousSliderConfig[] = [
    {
      beginIcon: 'far fa-tired',
      endIcon: 'fas fa-lightbulb',
      cuteName: 'Mental',
      modelRef: editMentalEnergyRequired,
      updateFunc: (x) => updateTask(task.value.id, { mental_energy_required: x })
    },
    {
      beginIcon: 'far fa-tired',
      endIcon: 'fas fa-dumbbell',
      cuteName: 'Physical',
      color: 'red',
      modelRef: editPhysicalEnergyRequired,
      updateFunc: (x) => updateTask(task.value.id, { physical_energy_required: x })
    }
  ]
</script>
