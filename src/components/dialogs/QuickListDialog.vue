<template>
  <q-dialog ref="dialogRef" :maximized="$q.screen.lt.md" @hide="onDialogHide">
    <q-card style="min-width: 500px; max-width: 800px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Quick Task List</div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>
      
      <q-card-section class="q-pt-md">
        <div v-for="(item, index) in items" :key="index" class="q-mb-sm">
          <q-input
            ref="inputRefs"
            v-model="items[index]"
            :autofocus="index === items.length - 1"
            outlined
            dense
            :placeholder="`Task ${index + 1}`"
            @keydown.enter="onItemEnter(index)"
            @keydown.delete="(e: KeyboardEvent) => onItemDelete(index, e)"
            @keydown.down="focusNext(index)"
            @keydown.up="focusPrev(index)"
            @keydown.esc="onDialogHide"
          >
            <template #append>
              <q-icon 
                v-if="index > 0" 
                name="close" 
                class="cursor-pointer" 
                @click="removeItem(index)"
              />
            </template>
          </q-input>
        </div>
      </q-card-section>

      <q-card-actions align="center" class="q-pb-md">
        <q-btn 
          color="primary" 
          label="Submit" 
          :disable="!hasValidItems" 
          no-caps
          @click="submitTasks"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick, onMounted } from 'vue'
  import { useDialogPluginComponent } from 'quasar'
  import { createTask } from 'src/utils/task-utils'
  import type { CreateTaskOptions } from 'src/stores/tasks/task-interfaces-types'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import { recalculate } from 'src/stores/tasks/task-view'
  import { useDependencyStore } from 'src/stores/dependencies/dependency-store'

  const depStore = useDependencyStore()

  const emit = defineEmits([...useDialogPluginComponent.emits])
  const { dialogRef, onDialogHide } = useDialogPluginComponent()
  const taskStore = useTaskStore()

  const items = ref<string[]>(['']) // Start with one empty item
  const inputRefs = ref<HTMLInputElement[]>([])

  const hasValidItems = computed(() => {
    return items.value.some(item => item.trim() !== '')
  })

  function onItemEnter(index: number) {
    const currentValue = items.value[index]?.trim()
    
    if (currentValue) {
      // Add new item if this is the last item and has content
      if (index === items.value.length - 1) {
        items.value.push('')
        nextTick(() => {
          focusInput(items.value.length - 1)
        })
      } else {
        // Move to next input if not the last one
        focusNext(index)
      }
    }
  }

  function onItemDelete(index: number, event: KeyboardEvent) {
    const currentValue = items.value[index] || ''
    
    if (currentValue === '' && index > 0) {
      // If empty and not the first item, remove it
      event.preventDefault() // Prevent default backspace behavior
      removeItem(index)
    }
  }

  function removeItem(index: number) {
    if (items.value.length > 1) {
      items.value.splice(index, 1)
      
      // Focus previous input after removal
      if (index > 0) {
        nextTick(() => {
          focusInput(Math.max(0, index - 1))
        })
      }
    }
  }

  function focusInput(index: number) {
    if (inputRefs.value && inputRefs.value[index]) {
      inputRefs.value[index].focus()
    }
  }

  function focusNext(index: number) {
    if (index < items.value.length - 1) {
      nextTick(() => {
        focusInput(index + 1)
      })
    }
  }

  function focusPrev(index: number) {
    if (index > 0) {
      nextTick(() => {
        focusInput(index - 1)
      })
    }
  }

  async function submitTasks() {
    if (!hasValidItems.value) return

    const createdTaskIds: number[] = []

    // Phase 1: Create all tasks with deferred recalculation
    for (const text of items.value) {
      const trimmedText = text.trim()
      if (!trimmedText) continue

      const taskOptions: CreateTaskOptions = {
        title: trimmedText
      }

      try {
        const createdTask = await taskStore.apiCreate(taskOptions, { skipRecalculate: true })
        if (createdTask) {
          createdTaskIds.push(createdTask.id)
        }
      } catch (error) {
        console.error('Error creating task:', error)
      }
    }

    // Phase 2: Add rules between tasks
    for (let i = 1; i < createdTaskIds.length; i++) {
      const prevTaskId = createdTaskIds[i - 1]!
      const currentTaskId = createdTaskIds[i]!
      try {
        await depStore.addRule(prevTaskId, currentTaskId, { skipRecalculate: true })
      } catch (error) {
        console.error('Error adding rule:', error)
      }
    }

    // Phase 3: Refresh cache and recalculate
    taskStore.refreshStarredCache()
    recalculate('QuickListDialog batch complete')

    onDialogHide()
  }

  // Focus first input when dialog opens
  onMounted(() => {
    focusInput(0)
  })
</script>