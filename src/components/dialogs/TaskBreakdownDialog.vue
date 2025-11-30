<template>
  <q-dialog ref="dialogRef" :maximized="$q.screen.lt.md" @hide="onDialogHide">
    <q-card style="min-width: 500px; max-width: 800px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Break Down Task</div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <div class="text-subtitle1 q-mb-md text-weight-medium">
          {{ task.title }}
        </div>
        <div class="text-caption text-grey-7 q-mb-md">
          Break this task into smaller subtasks:
        </div>

        <div v-for="(item, index) in items" :key="index" class="q-mb-sm">
          <q-input
            ref="inputRefs"
            v-model="items[index]"
            :autofocus="index === items.length - 1"
            outlined
            dense
            :placeholder="`Subtask ${index + 1}`"
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
          color="grey"
          label="No Refinement Needed"
          outline
          no-caps
          @click="markAsRefined"
        />
        <q-space />
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
  import type { CreateTaskOptions } from 'src/stores/tasks/task-interfaces-types'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import type { Task } from 'src/stores/tasks/task-model'
  import { useTaskNeedsRefinementStore } from 'src/stores/tasks/task-needs-refinement'

  const props = defineProps<{
    task: Task
  }>()

  const emit = defineEmits([...useDialogPluginComponent.emits])
  const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
  const taskStore = useTaskStore()
  const needsRefinementStore = useTaskNeedsRefinementStore()

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

  function markAsRefined() {
    // Just remove the needs refinement flag without creating subtasks
    needsRefinementStore.unmarkNeedsRefinement(props.task.id)
    onDialogOK()
  }

  async function submitTasks() {
    if (!hasValidItems.value) return

    let previousTaskId: number | null = null
    let lastTaskId: number | null = null

    for (const text of items.value) {
      const trimmedText = text.trim()
      if (!trimmedText) continue

      const taskOptions: CreateTaskOptions = {
        title: trimmedText,
        hard_prereq_ids: [],
        hard_postreq_ids: []
      }

      try {
        // Create the task directly using the store to get the created task
        const createdTask = await taskStore.apiCreate(taskOptions)

        // If there was a previous task, update it to add the new task as a postrequisite
        if (previousTaskId !== null && createdTask) {
          const prevTask = taskStore.mapp.get(previousTaskId)
          if (prevTask) {
            await taskStore.addRule(prevTask.id, createdTask.id)
          }
        }

        if (createdTask) {
          previousTaskId = createdTask.id
          lastTaskId = createdTask.id
        }
      } catch (error) {
        console.error('Error creating task:', error)
      }
    }

    // Make the last created subtask a prerequisite of the parent task
    // This creates a chain: A → B → C → Parent
    if (lastTaskId !== null) {
      await taskStore.addRule(lastTaskId, props.task.id)
    }

    // Remove needs refinement flag from the parent task
    needsRefinementStore.unmarkNeedsRefinement(props.task.id)

    onDialogOK()
  }

  // Focus first input when dialog opens
  onMounted(() => {
    focusInput(0)
  })
</script>
