<template>
  <q-dialog ref="dialogRef" :maximized="$q.screen.lt.md" @hide="onDialogHide">
    <div style="display: flex; gap: 16px;">
      <q-card :style="showSidebar && searchResults.length > 0 ? 'min-width: 300px; max-width: 500px;' : 'min-width: 550px; max-width: 800px;'">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Break Down Task</div>
          <q-space />
          <q-btn v-close-popup icon="close" flat round dense />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <div class="text-subtitle1 q-mb-sm text-weight-medium">
            {{ task.title }}
          </div>

          <!-- Incomplete Prerequisites -->
          <div v-if="incompletePrereqs.length > 0" class="q-mb-md">
            <div class="text-caption text-primary q-mb-xs">Prerequisites ({{ incompletePrereqs.length }}):</div>
            <div class="text-caption text-primary">
              <div v-for="prereq in visiblePrereqs" :key="prereq.id" class="q-pl-sm">
                • {{ prereq.title }}
              </div>
              <q-btn
                v-if="incompletePrereqs.length > 3"
                flat
                dense
                no-caps
                size="sm"
                :label="showAllPrereqs ? 'Show less' : `Show ${incompletePrereqs.length - 3} more`"
                class="q-pl-sm text-primary"
                @click="showAllPrereqs = !showAllPrereqs"
              />
            </div>
          </div>

          <div class="text-caption text-grey-7 q-mb-md">
            Break this task into a list of smaller steps:
          </div>

          <ul ref="listRef" style="list-style-type: none; margin: 0; padding: 0;">
            <li v-for="(item, index) in items" :key="item.id" class="q-mb-sm" style="display: flex; align-items: center; gap: 8px;">
              <q-avatar rounded icon="fa-solid fa-grip-vertical" class="drag-handle" color="grey" size="sm" style="cursor: grab;" />
              <q-input
                ref="inputRefs"
                v-model="item.text"
                :autofocus="index === items.length - 1"
                outlined
                dense
                :placeholder="`Subtask ${index + 1}`"
                style="flex: 1; pointer-events: auto; user-select: text;"
                :class="{
                  'existing-task-input': item.existingTask,
                  'cycle-error-input': itemHasCycleError(index)
                }"
                :debounce="50"
                @keydown.enter.prevent="onItemEnter(index)"
                @keydown.delete="(e: KeyboardEvent) => onItemDelete(index, e)"
                @keydown.down="focusNext(index)"
                @keydown.up="focusPrev(index)"
                @keydown.esc="onDialogHide"
                @focus="onInputFocus(index)"
                @blur="onInputBlur(index)"
                @update:model-value="(val) => onItemTextChange(index, val as string)"
              >
                <template #prepend>
                  <q-icon v-if="item.existingTask" name="link" color="green" />
                  <q-icon v-if="item.existingTask && !(item.existingTask.notes ?? '').includes('!!REFINE')" name="fa-solid fa-anchor-circle-check" color="green" />
                  <q-icon
                    v-if="itemHasCycleError(index)"
                    name="warning"
                    color="negative"
                  >
                    <q-tooltip class="bg-negative">
                      {{ getCycleErrorMessage(index) }}
                    </q-tooltip>
                  </q-icon>
                </template>
                <template #append>
                  <q-btn
                    v-if="!item.existingTask"
                    round
                    flat
                    dense
                    size="sm"
                    icon="search"
                    :color="focusedItemIndex === index && showSidebar ? 'primary' : 'grey'"
                    @mousedown.prevent="toggleSearchForItem(index)"
                  >
                    <q-tooltip>Search existing tasks</q-tooltip>
                  </q-btn>
                  <q-icon
                    v-if="index > 0"
                    name="close"
                    class="cursor-pointer"
                    @click="removeItem(index)"
                  />
                </template>
              </q-input>
            </li>
          </ul>
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
            color="green"
            label="Mark Complete"
            outline
            no-caps
            @click="complete"
          />
          <q-btn
            color="primary"
            label="Submit"
            :disable="!hasValidItems"
            no-caps
            @click="submitTasks"
          />
        </q-card-actions>
      </q-card>

      <!-- Search Results Sidebar -->
      <q-card v-if="showSidebar && searchResults.length > 0" style="width: 350px; max-width: 400px; max-height: 500px; overflow-y: auto;">
        <q-card-section class="q-pa-sm">
          <div class="text-subtitle2 q-mb-sm">Existing Tasks</div>
          <q-list dense>
            <q-item
              v-for="searchResultTask in searchResults as Task[]"
              :key="searchResultTask.id"
              clickable
              @click="selectExistingTask(searchResultTask, focusedItemIndex!)"
            >
              <q-item-section>
                <q-item-label>{{ searchResultTask.title }}</q-item-label>
              </q-item-section>
              <q-item-section avatar>
                <q-avatar v-if="!(searchResultTask.notes ?? '').includes('!!REFINE')" rounded icon="fa-solid fa-anchor-circle-check" color="green" size="sm" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick, onMounted } from 'vue'
  import { useDialogPluginComponent } from 'quasar'
  import type { CreateTaskOptions } from 'src/stores/tasks/task-interfaces-types'
  import { useTaskStore } from 'src/stores/tasks/task-store'
  import type { Task } from 'src/stores/tasks/task-model'
  import { useTaskNeedsRefinementStore } from 'src/stores/tasks/task-needs-refinement'
  import { recalculate } from 'src/stores/tasks/task-view'
  import { dontLookAtMe } from 'src/stores/tasks/look-i-dont-make-the-rules'
  import { useDragAndDrop } from '@formkit/drag-and-drop/vue'
  import Fuse from 'fuse.js'

  const ewww = dontLookAtMe()

  const props = defineProps<{
    task: Task
  }>()

  interface BreakdownItem {
    id: string
    text: string
    existingTask?: Task
  }

  const emit = defineEmits([...useDialogPluginComponent.emits])
  const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()
  const taskStore = useTaskStore()
  const needsRefinementStore = useTaskNeedsRefinementStore()

  let itemIdCounter = 0
  const generateId = () => `breakdown-item-${itemIdCounter++}`

  const createNewItem = (text = '', existingTask?: Task): BreakdownItem => ({
    id: generateId(),
    text,
    existingTask
  })

  const initialItems = [createNewItem()]
  const [listRef, items] = useDragAndDrop<BreakdownItem>(initialItems, {
    dragHandle: '.drag-handle'
  })

  const inputRefs = ref<HTMLInputElement[]>([])
  const showSidebar = ref(false)
  const focusedItemIndex = ref<number | null>(null)
  const searchResults = ref<Task[]>([])
  const showAllPrereqs = ref(false)
  let blurTimeout: ReturnType<typeof setTimeout> | null = null

  // Get incomplete prerequisites
  const incompletePrereqs = computed(() => props.task.grabPrereqs(true))
  const visiblePrereqs = computed(() =>
    showAllPrereqs.value ? incompletePrereqs.value : incompletePrereqs.value.slice(0, 3)
  )

  const hasValidItems = computed(() => {
    return items.value.some(item => item.text.trim() !== '' || item.existingTask)
  })

  // Search functionality
  const allTasks = computed(() => taskStore.incompleteOnly.value)
  const fuseOptions = {
    keys: ['title'],
    threshold: 0.3,
    includeScore: true
  }

  // IDs to exclude from search results
  const excludedIds = computed(() => {
    const ids = new Set<number>()
    // Exclude the parent task itself
    ids.add(props.task.id)
    // Exclude current prerequisites of the parent task
    for (const prereqId of props.task.hard_prereq_ids) {
      ids.add(prereqId)
    }
    // Exclude tasks already linked in the breakdown
    for (const item of items.value) {
      if (item.existingTask) {
        ids.add(item.existingTask.id)
      }
    }
    return ids
  })

  const searchForTasks = (query: string) => {
    //console.log('[searchForTasks] query:', query, 'allTasks.length:', allTasks.value.length)
    if (!query.trim()) {
      searchResults.value = []
      return
    }
    const fuse = new Fuse(allTasks.value, fuseOptions)
    const results = fuse.search(query, { limit: 20 })
    //console.log('[searchForTasks] fuse results:', results.length)

    // Filter out excluded tasks and deduplicate
    const excluded = excludedIds.value
    //console.log('[searchForTasks] excludedIds:', [...excluded])
    const seenIds = new Set<number>()
    const uniqueResults = results
      .map(r => r.item)
      .filter(task => {
        if (excluded.has(task.id)) return false
        if (seenIds.has(task.id)) return false
        seenIds.add(task.id)
        return true
      })
      .slice(0, 10)

    //console.log('[searchForTasks] final results:', uniqueResults.length)
    searchResults.value = uniqueResults
  }

  const lastSearchText = ref('')

  // Handle text changes explicitly (useDragAndDrop's reactivity doesn't trigger deep watch reliably)
  function onItemTextChange(index: number, text: string) {
    //console.log('[onItemTextChange] index:', index, 'text:', text, 'focusedItemIndex:', focusedItemIndex.value)
    if (focusedItemIndex.value !== index) {
      //console.log('[onItemTextChange] SKIPPED: focusedItemIndex mismatch')
      return
    }
    const item = items.value[index]
    if (!item || item.existingTask) {
      //console.log('[onItemTextChange] SKIPPED: no item or existingTask')
      return
    }

    if (text !== lastSearchText.value) {
      //console.log('[onItemTextChange] searching for:', text, 'lastSearchText was:', lastSearchText.value)
      lastSearchText.value = text
      searchForTasks(text)
      showSidebar.value = !!text.trim()
      //console.log('[onItemTextChange] after search - showSidebar:', showSidebar.value, 'searchResults.length:', searchResults.value.length)
    } else {
      //console.log('[onItemTextChange] SKIPPED: text unchanged')
    }
  }

  function selectExistingTask(task: Task, index: number) {
    items.value[index] = {
      id: items.value[index]!.id,
      text: task.title,
      existingTask: task
    }
    showSidebar.value = false
    searchResults.value = []
    focusedItemIndex.value = null
    lastSearchText.value = ''

    // Add a new blank item beneath the selected one
    items.value.splice(index + 1, 0, createNewItem())
    nextTick(() => {
      focusInput(index + 1)
    })
  }

  function onInputFocus(index: number) {
    //console.log('[onInputFocus] index:', index)
    // Clear any pending blur timeout
    if (blurTimeout) {
      clearTimeout(blurTimeout)
      blurTimeout = null
    }
    focusedItemIndex.value = index
    const item = items.value[index]
    //console.log('[onInputFocus] item:', item?.text, 'existingTask:', !!item?.existingTask)
    if (item && !item.existingTask && item.text.trim()) {
      lastSearchText.value = item.text
      showSidebar.value = true
      searchForTasks(item.text)
    } else {
      // Clear stale search results when focusing empty or linked item
      lastSearchText.value = ''
      showSidebar.value = false
      searchResults.value = []
    }
  }

  function onInputBlur(blurredIndex: number) {
    //console.log('[onInputBlur] index:', blurredIndex, 'starting 200ms timeout')
    // Delay hiding sidebar to allow clicking on search results
    blurTimeout = setTimeout(() => {
      // Only hide if focus hasn't moved to another input in our list
      // (if it did, onInputFocus would have updated focusedItemIndex to a different value)
      if (focusedItemIndex.value === blurredIndex) {
        //console.log('[onInputBlur] timeout fired, hiding sidebar')
        showSidebar.value = false
        focusedItemIndex.value = null
      } else {
        //console.log('[onInputBlur] timeout fired but focus moved to index:', focusedItemIndex.value)
      }
      blurTimeout = null
    }, 200)
  }

  function toggleSearchForItem(index: number) {
    // Focus the input and show sidebar
    focusInput(index)
    focusedItemIndex.value = index
    const item = items.value[index]
    if (item && !item.existingTask) {
      showSidebar.value = true
      if (item.text.trim()) {
        lastSearchText.value = item.text
        searchForTasks(item.text)
      }
    }
  }

  function onItemEnter(index: number) {
    // Always insert new item directly below the current item
    // The new item will auto-focus via :autofocus="index === items.length - 1"
    items.value.splice(index + 1, 0, createNewItem())
  }

  function onItemDelete(index: number, event: KeyboardEvent) {
    const item = items.value[index]
    const currentValue = item?.text || ''

    if (currentValue === '' && !item?.existingTask && index > 0) {
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

  async function complete() {
    await props.task.toggleCompleted()
    //needsRefinementStore.unmarkNeedsRefinement(props.task.id)
    onDialogOK()
  }

  async function submitTasks() {
    if (!hasValidItems.value) return

    const taskIds: number[] = []

    // Phase 1: Create new subtasks and collect existing task IDs
    for (const item of items.value) {
      if (item.existingTask) {
        // Use existing task
        taskIds.push(item.existingTask.id)
      } else {
        const trimmedText = item.text.trim()
        if (!trimmedText) continue

        const taskOptions: CreateTaskOptions = {
          title: trimmedText,
          hard_prereq_ids: [],
          hard_postreq_ids: []
        }

        try {
          const createdTask = await taskStore.apiCreate(taskOptions, { skipRecalculate: true })
          if (createdTask) {
            taskIds.push(createdTask.id)
          }
        } catch (error) {
          console.error('Error creating task:', error)
        }
      }
    }

    // Phase 2: Add rules between subtasks with batch operations deferred
    for (let i = 1; i < taskIds.length; i++) {
      const prevTaskId = taskIds[i - 1]!
      const currentTaskId = taskIds[i]!
      try {
        await taskStore.addRule(prevTaskId, currentTaskId, {
          skipRecalculate: true,
          skipBatchOperations: true
        })
      } catch (error) {
        console.error('Error adding rule:', error)
      }
    }

    // Phase 3: Link last subtask to parent task with batch operations deferred
    const lastTaskId = taskIds[taskIds.length - 1]
    if (lastTaskId !== undefined) {
      try {
        await taskStore.addRule(lastTaskId, props.task.id, {
          skipRecalculate: true,
          skipBatchOperations: true
        })
      } catch (error) {
        console.error('Error linking to parent task:', error)
      }
    }

    // Phase 4: Single batch update of task objects (including parent task)
    const allAffectedTaskIds = [...taskIds, props.task.id]
    taskStore.$patch(() => {
      for (const taskId of allAffectedTaskIds) {
        const task = taskStore.hardGet(taskId)
        const pres = ewww.grabPres(taskId)
        const posts = ewww.grabPosts(taskId)
        task.hard_prereq_ids = Array.from(pres.keys())
        task.hard_postreq_ids = Array.from(posts.keys())
      }
    })

    // Phase 5: Single cache refresh
    taskStore.refreshStarredCache()

    // Phase 6: Single recalculation
    recalculate('TaskBreakdownDialog batch complete')

    // Remove needs refinement flag from the parent task
    needsRefinementStore.unmarkNeedsRefinement(props.task.id)

    onDialogOK()
  }

  // Cycle detection: if task B is a prereq of task A, but A is placed above B, that's a conflict
  interface CycleError {
    index: number
    conflictIndex: number
    message: string
  }

  const cycleErrors = computed<CycleError[]>(() => {
    const existing = items.value
      .map((item, index) => ({ index, task: item.existingTask }))
      .filter((x): x is { index: number; task: Task } => !!x.task)

    if (existing.length < 2) return []

    const allIds = existing.map(x => x.task.id)
    const errors: CycleError[] = []

    for (let i = 0; i < existing.length; i++) {
      const current = existing[i]!
      const prereqs = current.task.anyIDsAbove(allIds)

      for (let j = i + 1; j < existing.length; j++) {
        const below = existing[j]!
        if (prereqs.get(below.task.id)) {
          errors.push({
            index: current.index,
            conflictIndex: below.index,
            message: `"${below.task.title}" must come before "${current.task.title}"`
          })
        }
      }
    }
    return errors
  })

  const itemHasCycleError = (index: number) => cycleErrors.value.some(e => e.index === index)
  const getCycleErrorMessage = (index: number) => cycleErrors.value.find(e => e.index === index)?.message ?? ''

  // Focus first input when dialog opens
  onMounted(() => {
    focusInput(0)
  })
</script>

<style scoped>
.existing-task-input :deep(.q-field__control) {
  border: 4px solid darkgreen !important;
}

.cycle-error-input :deep(.q-field__control) {
  border: 2px solid var(--q-negative) !important;
}

.drag-handle {
  flex-shrink: 0;
}

.drag-handle:active {
  cursor: grabbing;
}
</style>
