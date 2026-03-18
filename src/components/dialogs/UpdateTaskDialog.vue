<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" maximized data-cy="update_task_dialog" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Task {{ currentTask.id }} Details</div>
        <ButtonBarComponent :buttons="topButtonBar" :target="currentTask as Task" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div :key="currentTask.id" class="col-12 col-md">
            <div class="row items-center q-gutter-sm">
              <q-btn 
                :icon="useTaskStarredStore().isStarred(currentTask.id) ? 'fas fa-star' : 'far fa-star'"
                flat
                round
                size="lg"
                :color="useTaskStarredStore().isStarred(currentTask.id) ? 'yellow' : 'grey'" 
                @click="useTaskStarredStore().toggle(currentTask.id)"
              />
              <div class="col">
                <TaskInputTitle v-model:task="currentTask as Task" />
              </div>
            </div>
            <TaskInputList v-model:task="currentTask as Task" />
            <TaskInputSchedule v-model="currentTask.schedule_id" @update:schedule="updateSchedule" />
            <TaskInputProcedures v-model:task="currentTask as Task" />
            <TaskInputRemindMeAt v-model:task="currentTask as Task" />
            <TaskInputDueAt v-model:task="currentTask as Task" />
            <TaskInputDuration v-model="currentTask.task_duration_in_minutes" @update:duration="updateDuration" />
            <TaskInputEnergy v-model:task="currentTask as Task" />
            <br>
            <TaskInputNotes v-model:task="currentTask as Task" />
          </div>
          <div class="col-12 col-md">
            <IncompleteOnlyToggle />
            <DependencyList
              :items="allPres"
              :dependency-type="preDepType"
              :menu-items="prereqMenuItems"
              :degrees="preDegrees"
              show-prune
              @prune-dependencies="prunePres"
              @add-item="openPrerequisiteDialog"
              @remove-item="removePre"
              @select-item="setCurrentTask"
              @toggle-completed-item="(x: Task) => x.updateTaskCompletionStatus()"
              @update-degree="(p) => depStore.updateDegree(p.taskId, currentTask.id, p.degree)"
            />
            <q-btn label="Sort Postreqs" @click="openSortPostreqsDialog" />
            <DependencyList
              :items="allPosts"
              :dependency-type="postDepType"
              :menu-items="postreqMenuItems"
              :degrees="postDegrees"
              show-prune
              @prune-dependencies="prunePosts"
              @prune-posts-one-star="unloadOneStarPosts"
              @add-item="openPostrequisiteDialog"
              @remove-item="removePost"
              @select-item="setCurrentTask"
              @toggle-completed-item="(x: Task) => x.updateTaskCompletionStatus()"
              @update-degree="(p) => depStore.updateDegree(currentTask.id, p.taskId, p.degree)"
            />
            <div class="row">
              <div class="col">
                <div class="text-h5">Subtasks</div>
              </div>
              <div class="col text-right">
                <q-btn color="primary" icon="fas fa-tasks" label="Add Subtask" />
              </div>
            </div>
            <q-list class="q-my-md">
              <q-item v-ripple>
                <q-item-section>No subtasks</q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { useDialogPluginComponent, useQuasar, useMeta } from 'quasar'
  import { computed, ref } from 'vue'
  import DependencyList from '../DependencyList.vue'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import QuickPrioritizeDialog from './QuickPrioritizeDialog.vue'
  import {
    handleError,
    handleSuccess,
    notifySuccess
  } from 'src/utils/notification-utils'
  import TaskSearchDialog from './TaskSearchDialog.vue'
  import type { Button, unknownishλ, λ } from 'src/utils/types'
  import { onMounted } from 'vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import IncompleteOnlyToggle from 'src/components/Settings/IncompleteOnlyToggle.vue'
  import TaskInputTitle from 'src/components/TaskInputTitle.vue'
  import TaskInputList from 'src/components/TaskInputList.vue'
  import TaskInputSchedule from 'src/components/TaskInputSchedule.vue'
  import TaskInputProcedures from 'src/components/TaskInputProcedures.vue'
  import TaskInputRemindMeAt from 'src/components/TaskInputRemindMeAt.vue'
  import TaskInputDueAt from '../TaskInputDueAt.vue'
  import TaskInputEnergy from 'src/components/TaskInputEnergy.vue'
  import TaskInputNotes from 'src/components/TaskInputNotes.vue'
  import TaskInputDuration from '../TaskInputDuration.vue'
  import ButtonBarComponent from '../ButtonBarComponent.vue'

  import { storeToRefs } from 'pinia'
  import { hardCheck } from 'src/utils/type-utils'
  import {
    addPostrequisiteDialog,
    openTaskBreakdownDialog,
    openTaskSlicerDialog,
    quickSortPostreqsDialog
  } from 'src/utils/dialog-utils'
  import { blockingFunc } from 'src/utils/performance-utils'

  import { useTaskStore } from 'src/stores/tasks/task-store'
  import type { Task } from 'src/stores/tasks/task-model'
  import { Logger } from 'src/utils/d'
  import { useDependencyStore } from 'src/stores/dependencies/dependency-store'
  import { useTaskStarredStore } from 'src/stores/tasks/task-starred'

  const updateTaskDialogger = new Logger('Update Task Dialog', '#008800')

  // HACK: The `:key="currentTask.id"` works for refreshing on task change, but isn't ideal
  // FIXME: Find a better way to switch between tasks

  // const props = defineProps({
  //   task: { type: Task, required: true }
  // })

  const props = defineProps<{
    task: Task
  }>()

  const currentTask = ref<Task>(props.task)

  // const currentTask = ref<Task>(new Task({ title: 'asdf' }))

  // const { task } = toRefs(props)

  // const currentTask = toRef(props, 'task')

  const prioritize = () => {
    $q.dialog({
      component: QuickPrioritizeDialog,
      componentProps: {
        task: currentTask.value
      }
    })
  }

  const topButtonBar = computed((): Button<Task>[] => {
    const action = (x: Task) => x.toggleCompleted()
    // why am I like this?
    const positiveColorButton = (label: string, action: unknownishλ<Task>) => ({
      color: 'positive',
      label,
      dataCy: 'why_are_you_like_this',
      action
    })
    const deleteButton = {
      color: 'negative',
      label: 'Delete',
      dataCy: 'delete_task_button',
      action: deleteTask
    }
    const markIncompleteButton = {
      color: 'primary',
      label: 'Mark Incomplete',
      dataCy: 'mark_incomplete_button',
      action
    }
    const closeButton = {
      color: 'grey',
      label: 'Close',
      dataCy: 'close_dialog',
      action: onDialogCancel
    }
    const markCompleteButton = positiveColorButton('Mark Complete', action)
    const prioritizeButton = positiveColorButton('Prioritize', prioritize)
    const sliceButton = positiveColorButton('Slice Task', openTaskSlicerDialog)
    if (currentTask.value.completed) return [markIncompleteButton, deleteButton, closeButton]
    return [markCompleteButton, prioritizeButton, sliceButton, deleteButton, closeButton]
  })

  const emit = defineEmits([...useDialogPluginComponent.emits])

  const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
  const $q = useQuasar()

  let currentPre: Task | null = null
  // let currentPost: Task | null = null

  // updateTaskDialogger.debug('UpdateTaskDialog: task prop value: ', currentTask.value)

  useMeta(() => ({ title: currentTask.value.title + ' | TDL App' }))

  const { hideCompleted } = storeToRefs(useLocalSettingsStore())

  const currentTaskFromStore = computed(() => {
    const t = useTaskStore().hardGet(currentTask.value.id)
    return t
  })

  const depStore = useDependencyStore()

  const allPres = computed(() => {
    const taskStore = useTaskStore()
    const entries = hideCompleted.value ? depStore.getIncompletePres(currentTaskFromStore.value.id) : depStore.getPres(currentTaskFromStore.value.id)
    return entries.map(e => taskStore.mapp.get(e.task_id)).filter(Boolean) as Task[]
  })
  const allPosts = computed(() => {
    const taskStore = useTaskStore()
    const entries = hideCompleted.value ? depStore.getIncompletePosts(currentTaskFromStore.value.id) : depStore.getPosts(currentTaskFromStore.value.id)
    return entries.map(e => taskStore.mapp.get(e.task_id)).filter(Boolean) as Task[]
  })

  const preDegrees = computed(() => {
    const entries = depStore.getPres(currentTaskFromStore.value.id)
    const map = new Map<number, 1 | 2 | 3 | null>()
    for (const e of entries) map.set(e.task_id, e.degree)
    return map
  })

  const postDegrees = computed(() => {
    const entries = depStore.getPosts(currentTaskFromStore.value.id)
    const map = new Map<number, 1 | 2 | 3 | null>()
    for (const e of entries) map.set(e.task_id, e.degree)
    return map
  })

  function setCurrentTask(newTask: Task) {
    updateTaskDialogger.debug('setCurrentTask')
    currentTask.value = newTask
  }

  function deleteTask(task: Task) {
    $q.dialog({
      title: `Delete task: "${task.title}"`,
      message: 'This cannot be undone! Are you sure?',
      ok: {
        label: 'Delete',
        color: 'negative'
      },
      cancel: {
        color: 'grey'
      }
    }).onOk(() => {
      updateTaskDialogger.debug('deleting task')
      useTaskStore()
        .apiDelete(task.id)
        .then(
          handleSuccess('Deleted task', 'fa-solid fa-tasks'),
          handleError('Failed to delete task.')
        )
    })
  }

  const openPrerequisiteDialog = () => openTaskBreakdownDialog(currentTask.value as Task)
  const openPostrequisiteDialog = () => addPostrequisiteDialog(currentTask.value as Task)
  const openSortPostreqsDialog = () => quickSortPostreqsDialog(currentTask.value.id)

  // FIXME: this destroys everything
  const mvpPostrequisite = async (post: Task) => {
    updateTaskDialogger.debug(post)
    const allPostreqs = currentTaskFromStore.value.grabPostreqs(false)
    const postPostIds = depStore.getPostTaskIds(post.id)
    for (let i = 0; i < allPostreqs.length; i++) {
      const tmp = allPostreqs[i]!
      updateTaskDialogger.debug(`now evaluating ${tmp.title}`)
      if(tmp.id === post.id) {
        updateTaskDialogger.debug(`skipping this task because it is the post being promoted to mvp: ${tmp.title}`)
        continue
      }
      if(tmp.completed) {
        updateTaskDialogger.debug(`skipping this task because it is already completed: ${tmp.title}`)
        continue
      }
      // Remove dependency from current task to tmp
      await depStore.removeRule(currentTask.value.id, tmp.id)
      if(postPostIds.includes(tmp.id)) {
        updateTaskDialogger.debug(`removed postreq from original, but not adding to mvp as it is already a postreq of mvp: ${tmp.title}`)
      }
      else {
        await depStore.addRule(post.id, tmp.id)
      }
    }

    // const syncResult = await syncWithBackend()
    // if (syncResult === 1)
    //   errorNotification(new Error('Failed to refresh local storage'), 'Error Refreshing All')
    // else notifySuccess('Refreshed All')
  }

  const insertBetweenPre = async (payload: { task: Task }) => {
    const oldPre = hardCheck(currentPre)
    await depStore.removeRule(oldPre.id, currentTask.value.id)
    await depStore
      .addRule(oldPre.id, payload.task.id)
      .then(
        handleSuccess('successfully moved prerequisite!'),
        handleError('error moving prerequisite!')
      )
    const currentPreIds = depStore.getPreTaskIds(currentTask.value.id)
    if (!currentPreIds.includes(payload.task.id)) {
      await depStore
        .addRule(payload.task.id, currentTask.value.id)
        .then(
          handleSuccess('added new pre to current task'),
          handleError('error adding new pre to current task')
        )
    }
  }

  // when is a joke taken too far? - never, full send λ
  const insertBetweenFilter: λ<number | undefined, λ<Task, boolean>> =
    (taskID: number | undefined) => (x: Task) =>
      !x.completed

  const dialogInsertBetweenPost = (post: Task) => {
    notifySuccess('Coming soon')
    //   currentPost = post
    //   $q.dialog({
    //     component: TaskSearchDialog,
    //     componentProps: {
    //       dialogTitle: 'Insert Task Between Two Others',
    //       taskID: currentTaskID.value,
    //       searchLabel: 'Search',
    //       resultsTitle: 'Search Results',
    //       closeOnSelect: false,
    //       onSelect: insertBetweenPost,
    //       initialFilter: insertBetweenFilter,
    //       batchFilter: (taskID: number | undefined) => (tasks: Task[]) => {
    //         if (typeof taskID === 'undefined') {
    //           updateTaskDialogger.warn('task id is undefined')
    //           return []
    //         }
    //         const ct = useTaskStore().hardGet(taskID)
    //         if (ct === null) {
    //           updateTaskDialogger.warn('current task was not found (by id)')
    //           return []
    //         }
    //         const relationInfo = ct.anyIDsAbove(tasks.map((x) => x.id))
    //         if (currentPost === null) {
    //           updateTaskDialogger.warn('current postrequisite info was not passed in')
    //           return []
    //         }
    //         const postRelationInfo = currentPost.anyIDsBelow(tasks.map((x) => x.id))
    //         return tasks
    //           .filter((x) => relationInfo.get(x.id) !== true)
    //           .filter((x) => postRelationInfo.get(x.id) !== true)
    //       }
    //     }
    //   })
  }

  const dialogInsertBetweenPre = (pre: Task) => {
    currentPre = pre
    $q.dialog({
      component: TaskSearchDialog,
      componentProps: {
        dialogTitle: 'Insert Task Between Two Others',
        taskID: currentTask.value.id,
        searchLabel: 'Search',
        resultsTitle: 'Search Results',
        closeOnSelect: false,
        onSelect: insertBetweenPre,
        initialFilter: insertBetweenFilter,
        batchFilter: (taskID: number | undefined) => (tasks: Task[]) => {
          if (typeof taskID === 'undefined') {
            updateTaskDialogger.warn('task id is undefined')
            return []
          }
          const ct = useTaskStore().hardGet(taskID)
          if (ct === null) {
            updateTaskDialogger.warn('current task was not found (by id)')
            return []
          }
          const relationInfo = ct.anyIDsBelow(tasks.map((x) => x.id))
          if (currentPre === null) {
            updateTaskDialogger.warn('current prerequisite info was not passed in')
            return []
          }
          const preRelationInfo = currentPre.anyIDsAbove(tasks.map((x) => x.id))
          return tasks
            .filter((x) => relationInfo.get(x.id) !== true)
            .filter((x) => preRelationInfo.get(x.id) !== true)
        }
      }
    })
  }

  const preDepType = {
    plural: 'Prerequisites',
    singular: 'Prerequisite'
  } as const

  const postDepType = {
    plural: 'Postrequisites',
    singular: 'Postrequisite'
  } as const

  const prereqMenuItems = [
    {
      label: 'Unlink this Prerequisite',
      icon: 'fas fa-unlink',
      action: (x: Task) => depStore.removeRule(x.id, currentTask.value.id)
    },
    {
      label: 'Add Task Between This Prereq and This Task',
      icon: 'fas fa-flask',
      action: dialogInsertBetweenPre
    }
  ]

  const postreqMenuItems = [
    {
      label: 'Unlink this Postrequisite',
      icon: 'fas fa-unlink',
      action: (x: Task) => depStore.removeRule(currentTask.value.id, x.id)
    },
    {
      label: 'Move all Postreqs from Current Task to This Task',
      icon: 'fas fa-triangle-exclamation',
      action: mvpPostrequisite
    },
    {
      label: 'Add Task Between This Postreq and This Task',
      icon: 'fas fa-flask',
      action: dialogInsertBetweenPost
    }
  ]

  const prunePosts = blockingFunc(async (payload: { above: Set<number>; below: Set<number> }) => {
    useLoadingStateStore().busy = true
    const toRemove = allPosts.value.filter(
      (x) => payload.below.has(x.id) && !payload.above.has(x.id)
    )
    for (let i = 0; i < toRemove.length; i++) {
      await depStore.removeRule(currentTask.value.id, toRemove[i]!.id)
    }
    useLoadingStateStore().busy = false
  })

  const unloadOneStarPosts = async () => {
    const posts = useDependencyStore().getPosts(currentTask.value.id)
    const unsetDegree = useLocalSettingsStore().unsetDegreeBehavior
    for (let i = 0; i < posts.length; i++) {
      if((posts[i]!.degree ?? unsetDegree) === 1) {
        await depStore.removeRule(currentTask.value.id, posts[i]!.task_id)
      } 
    }
  }

  const prunePres = blockingFunc(async (payload: { above: Set<number>; below: Set<number> }) => {
    const toRemove = allPres.value.filter((x) => {
      const hasRelationsAbove = payload.above.has(x.id)
      const hasRelationsBelow = payload.below.has(x.id)
      updateTaskDialogger.log({ hasRelationsAbove, hasRelationsBelow, x })
      return hasRelationsAbove && !hasRelationsBelow
    })
    updateTaskDialogger.log('pruning prerequisites', { payload, toRemove })
    for (let i = 0; i < toRemove.length; i++) {
      await depStore.removeRule(toRemove[i]!.id, currentTask.value.id)
    }
  })

  const removePre = (task: Task, id_of_prereq: number) => {
    depStore
      .removeRule(id_of_prereq, task.id)
      .then(handleSuccess('Removed a prerequisite'), handleError('Error removing the prerequisite'))
  }

  const removePost = (task: Task, id_of_postreq: number) => {
    depStore
      .removeRule(task.id, id_of_postreq)
      .then(handleSuccess('Removed a postrequisite'), handleError('Error removing the postrequisite'))
  }

  const updateDuration = async (task_duration_in_minutes: number | undefined) => {
    await useTaskStore().apiUpdate(currentTask.value.id, { task_duration_in_minutes })
  }

  const updateSchedule = async (schedule_id: number | undefined) => {
    await useTaskStore().apiUpdate(currentTask.value.id, { schedule_id })
  }
</script>
