<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" maximized data-cy="update_task_dialog" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Task Details</div>
        <ButtonBarComponent :buttons="topButtonBar" :target="currentTask as Task" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12 col-md">
            <q-item-label class="text-h4 text-primary" lines="3">{{
              currentTask.title
            }}</q-item-label>
            <GloriousTextInput
              v-model="editTitle"
              label="Task Title"
              :placeholder="currentTask.title"
              data-cy="task_title_input"
              @enter-key="updateTask({ title: editTitle })"
            />
            <q-select
              v-model="selectedList"
              filled
              hide-selected
              fill-input
              input-debounce="20"
              :options="lists"
              use-chips
              option-label="title"
              map-options
              emit-value
              label="List"
              use-input
              option-value="id"
              class="q-my-md text-primary"
              @filter="filterSelection"
              @update:model-value="updateList"
            />
            <q-select
              v-model="selectedProcedures"
              multiple
              filled
              fill-input
              input-debounce="20"
              :options="procedures"
              use-chips
              option-label="title"
              map-options
              emit-value
              label="Procedures"
              use-input
              class="q-my-md text-primary"
              @update:model-value="updateProcedures"
            />
            <q-datetime-input
              v-model="editRemindMeAt"
              label="Remind me at"
              class="q-my-md"
              @update:model-value="updateTask({ remind_me_at: editRemindMeAt })"
            />
            <q-expansion-item
              v-model="expandEnergyStats"
              expand-separator
              switch-toggle-side
              icon="fas fa-lightbulb"
              caption="Metadata"
            >
              <br />
              <GloriousSlider
                v-for="(s, key) of sliders"
                :key="key"
                v-model="s.modelRef.value"
                v-bind="s"
                @change="s.updateFunc"
              />
            </q-expansion-item>
            <br />
            <q-input
              v-model="editNotes"
              filled
              autogrow
              debounce="1000"
              label="Notes"
              @update:model-value="updateTask({ notes: editNotes })"
            />
          </div>
          <div class="col-12 col-md">
            <IncompleteOnlyToggle />
            <DependencyList
              :items="allPres"
              :dependency-type="preDepType"
              :menu-items="prereqMenuItems"
              show-prune
              @prune-dependencies="prunePres"
              @add-item="openPrerequisiteDialog"
              @remove-item="tr.removePre"
              @select-item="setCurrentTask"
              @toggle-completed-item="updateTaskCompletedStatus"
            />
            <DependencyList
              :items="allPosts"
              :dependency-type="postDepType"
              :menu-items="postreqMenuItems"
              show-prune
              @prune-dependencies="prunePosts"
              @add-item="openPostrequisiteDialog"
              @remove-item="tr.removePost"
              @select-item="setCurrentTask"
              @toggle-completed-item="updateTaskCompletedStatus"
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
  import QDatetimeInput from 'components/QDatetimeInput.vue'
  import { ListRepo } from 'src/stores/lists/list'
  import { AllOptionalTaskProperties, Task, TaskRepo } from 'src/stores/tasks/task'
  import { useRepo } from 'pinia-orm'
  import { Utils } from 'src/util'
  import { TDLAPP } from 'src/TDLAPP'
  import { syncWithBackend } from 'src/hackerman/sync'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import QuickPrioritizeDialog from './QuickPrioritizeDialog.vue'
  import errorNotification from 'src/hackerman/ErrorNotification'
  import TaskSearchDialog from './TaskSearchDialog.vue'
  import { Button, unknownishλ, λ } from 'src/types'
  import { onMounted } from 'vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import GloriousTextInput from '../GloriousTextInput.vue'
  import { useCurrentTaskStore } from 'src/stores/task-meta/current-task'
  import { GloriousSliderConfig } from 'src/glorious'
  import IncompleteOnlyToggle from 'src/components/Settings/IncompleteOnlyToggle.vue'
  import ButtonBarComponent from '../ButtonBarComponent.vue'
  import GloriousSlider from '../GloriousSlider.vue'
  import { storeToRefs } from 'pinia'
  import { ProcedureRepo } from 'src/stores/procedures/procedure'

  const cts = useCurrentTaskStore()
  const currentTaskID = computed(() => cts.id)
  const currentTask = computed(() => {
    const id = currentTaskID.value
    if (id === null) throw new Error('no id')
    const t = useRepo(TaskRepo).withAll().find(id)
    if (typeof t === 'undefined' || t === null)
      throw new Error('id does not match a task in the repo')
    console.log({ t })
    return t
  })

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
    const sliceButton = positiveColorButton('Slice Task', TDLAPP.sliceTask)
    if (currentTask.value.completed) return [markIncompleteButton, deleteButton, closeButton]
    return [markCompleteButton, prioritizeButton, sliceButton, deleteButton, closeButton]
  })

  const editMentalEnergyRequired = ref(currentTask.value.mental_energy_required)
  const editPhysicalEnergyRequired = ref(currentTask.value.physical_energy_required)

  const sliders: GloriousSliderConfig[] = [
    {
      beginIcon: 'far fa-tired',
      endIcon: 'fas fa-lightbulb',
      cuteName: 'Mental',
      modelRef: editMentalEnergyRequired,
      updateFunc: (x) => updateTask({ mental_energy_required: x })
    },
    {
      beginIcon: 'far fa-tired',
      endIcon: 'fas fa-dumbbell',
      cuteName: 'Physical',
      color: 'red',
      modelRef: editPhysicalEnergyRequired,
      updateFunc: (x) => updateTask({ physical_energy_required: x })
    }
  ]

  const emit = defineEmits([...useDialogPluginComponent.emits])

  const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
  const $q = useQuasar()
  const listsRepo = useRepo(ListRepo)
  const tr = useRepo(TaskRepo)
  const usr = useLocalSettingsStore()

  onMounted(() => {
    currentTask.value.hard_postreqs.sort(
      (a, b) => b.hard_postreq_ids.length - a.hard_postreq_ids.length
    )
    currentTask.value.hard_prereqs.sort(
      (a, b) => b.hard_postreq_ids.length - a.hard_postreq_ids.length
    )
  })

  let currentPre: Task | null = null
  let currentPost: Task | null = null

  console.debug('UpdateTaskDialog: task prop value: ', currentTask.value)

  useMeta(() => ({ title: currentTask.value.title + ' | TDL App' }))

  const editTitle = ref(currentTask.value.title)
  const editNotes = ref(currentTask.value.notes)
  const editRemindMeAt = ref(currentTask.value.remind_me_at)

  const { expandEnergyStats, hideCompleted } = storeToRefs(usr)

  const lists = computed(() => listsRepo.all())
  const procedures = computed(() => useRepo(ProcedureRepo).all())
  const allPres = computed(() => currentTask.value.grabPrereqs(hideCompleted.value))
  const allPosts = computed(() => currentTask.value.grabPostreqs(hideCompleted.value))

  const updateTaskCompletedStatus = async (task: Task) => {
    const newStatus = task.completed
    console.debug(`marking ${task.id} ${newStatus ? 'completed' : 'incomplete'}.`)
    const result = await tr.updateAndCache({ id: task.id, payload: { task } })
    if (result.completed !== newStatus)
      throw new Error('result from update request is not the same as the status marked on UI')
  }

  const updateList = () => updateTask({ list_id: selectedList.value?.id })

  const updateProcedures = () => {
    updateTask({ procedure_ids: selectedProcedures.value.map((x) => x.id) })
  }

  const allLists = listsRepo.all()
  const listOptions = ref(allLists)

  // thank you Berichtsheft for concise type info on this piece of quasar api
  type voidFn = () => void
  type doneFn = (a: voidFn) => void

  const filterSelection = (val: string, update: doneFn) => {
    update(() => {
      if (val === '') {
        listOptions.value = allLists
      } else {
        const query = val.toLowerCase()
        listOptions.value = allLists.filter((x) => {
          return x.title.toLowerCase().includes(query)
        })
      }
    })
  }

  function getSelectedList(task: Task) {
    return !!task.list ? { id: task.list.id, title: task.list.title } : null
  }

  const selectedList = ref(getSelectedList(currentTask.value))
  const selectedProcedures = ref(currentTask.value.procedures)

  function setCurrentTask(newTask: Task) {
    console.debug('setCurrentTask')
    cts.id = newTask.id
    editTitle.value = currentTask.value.title
    editNotes.value = currentTask.value.notes
    editRemindMeAt.value = currentTask.value.remind_me_at
    editMentalEnergyRequired.value = currentTask.value.mental_energy_required
    editPhysicalEnergyRequired.value = currentTask.value.physical_energy_required
    selectedList.value = getSelectedList(currentTask.value)
    selectedProcedures.value = currentTask.value.procedures
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
      console.debug('deleting task')
      tr.deleteTask(task).then(
        Utils.handleSuccess('Deleted task', 'fa-solid fa-tasks'),
        Utils.handleError('Failed to delete task.')
      )
    })
  }

  function updateTask(options: AllOptionalTaskProperties) {
    tr.updateAndCache({
      id: currentTask.value.id,
      payload: { task: options }
    }).then(() => {
      Utils.notifySuccess('Task Was Updated')
    }, Utils.handleError('Error updating task'))
  }

  const openPrerequisiteDialog = () => TDLAPP.addPrerequisitesDialog(currentTask.value)

  const openPostrequisiteDialog = () => TDLAPP.addPostrequisiteDialog(currentTask.value)

  const mvpPostrequisite = async (post: Task) => {
    console.debug(post)
    const allOtherPosts = allPosts.value.filter((x) => !x.completed && x.id !== post.id)
    for (let i = 0; i < allOtherPosts.length; i++) {
      tr.removePre(allOtherPosts[i], currentTask.value.id)
      await tr
        .addPre(allOtherPosts[i], post.id)
        .then(Utils.handleSuccess('moved a task'), Utils.handleError('failed to move a task'))
    }
    const syncResult = await syncWithBackend()
    if (syncResult === 1)
      errorNotification(new Error('Failed to refresh local storage'), 'Error Refreshing All')
    else Utils.notifySuccess('Refreshed All')
  }

  const insertBetweenPost = async (payload: { task: Task }) => {
    const oldPost = Utils.hardCheck(currentPost)
    // start: A --> C
    // desired end state: A --> B --> C
    // 2. remove rule A --> C
    console.debug('removing the old (now redundant) postrequisite from the current task')
    await tr.removePost(currentTask.value, oldPost.id)
    const ct = useRepo(TaskRepo).find(currentTaskID.value)
    if (ct === null) throw new Error('current task was not found by id')
    if (ct.hard_postreq_ids.includes(oldPost.id)) throw new Error('postreq was not removed!')
    const op = useRepo(TaskRepo).find(oldPost.id)
    if (op === null) throw new Error('old post was not found by id')
    if (op.hard_prereq_ids.includes(currentTaskID.value)) throw new Error('prereq was not removed!')
    // FIXME: if these steps are done in 1->2->3 order, currentTask somehow ends up with no postrequisite.
    // FIXME: I'm sure there is the same error for insertbetweenPre.
    // 3. add rule B --> C
    console.debug('adding the old postrequisite to the new postrequisite of the current task')
    await tr.addPost(payload.task, oldPost.id)
    const pt = useRepo(TaskRepo).find(payload.task.id)
    if (pt === null) throw new Error('new task was not found by id')
    if (!pt.hard_postreq_ids.includes(oldPost.id)) {
      throw new Error('postreq was not added to new postreq!')
    }
    if (!op.hard_prereq_ids.includes(payload.task.id))
      throw new Error('prereq was not added to old postreq!')
    // 1. add rule A --> B
    console.debug('adding selected postrequisite to current task')
    if (!currentTask.value.hard_postreq_ids.includes(payload.task.id)) {
      await tr.addPost(currentTask.value, payload.task.id).then(() => {
        const ct = useRepo(TaskRepo).find(currentTaskID.value)
        if (ct === null) throw new Error('current task was not found by id')
        if (!ct.hard_postreq_ids.includes(payload.task.id))
          throw new Error('postreq was not added!')
        const pt = useRepo(TaskRepo).find(payload.task.id)
        if (pt === null) throw new Error('payload task was not found by id')
        if (!pt.hard_prereq_ids.includes(currentTaskID.value))
          throw new Error('prereq (current task) was not found related to new postreq')
      }, Utils.handleError('error adding new post to current task'))

      const newPost = await useRepo(TaskRepo).getId(payload.task.id)
      console.log({ newPost })
      if (newPost === null) throw new Error('newPost is null')
      if (!newPost.hard_prereq_ids.includes(currentTask.value.id)) {
        throw new Error('new post does not have current task as a pre!')
      }
    }
  }

  const insertBetweenPre = async (payload: { task: Task }) => {
    const oldPre = Utils.hardCheck(currentPre)
    await tr.removePre(currentTask.value, oldPre.id)
    await tr
      .addPre(payload.task, oldPre.id)
      .then(
        Utils.handleSuccess('successfully moved prerequisite!'),
        Utils.handleError('error moving prerequisite!')
      )
    if (!currentTask.value.hard_prereq_ids.includes(payload.task.id)) {
      await tr
        .addPre(currentTask.value, payload.task.id)
        .then(
          Utils.handleSuccess('added new pre to current task'),
          Utils.handleError('error adding new pre to current task')
        )
    }
  }

  // when is a joke taken too far?
  const insertBetweenFilter: λ<number | undefined, λ<Task, boolean>> =
    (taskID: number | undefined) => (x: Task) =>
      !x.completed

  const dialogInsertBetweenPost = (post: Task) => {
    currentPost = post
    $q.dialog({
      component: TaskSearchDialog,
      componentProps: {
        dialogTitle: 'Insert Task Between Two Others',
        taskID: currentTaskID.value,
        searchLabel: 'Search',
        resultsTitle: 'Search Results',
        closeOnSelect: false,
        onSelect: insertBetweenPost,
        initialFilter: insertBetweenFilter,
        batchFilter: (taskID: number | undefined) => (tasks: Task[]) => {
          if (typeof taskID === 'undefined') {
            console.warn('task id is undefined')
            return []
          }
          const ct = useRepo(TaskRepo).withAll().find(taskID)
          if (ct === null) {
            console.warn('current task was not found (by id)')
            return []
          }
          const relationInfo = ct.anyIDsAbove(tasks.map((x) => x.id))
          if (currentPost === null) {
            console.warn('current postrequisite info was not passed in')
            return []
          }
          const postRelationInfo = currentPost.anyIDsBelow(tasks.map((x) => x.id))
          return tasks
            .filter((x) => relationInfo.get(x.id) !== true)
            .filter((x) => postRelationInfo.get(x.id) !== true)
        }
      }
    })
  }

  const dialogInsertBetweenPre = (pre: Task) => {
    currentPre = pre
    $q.dialog({
      component: TaskSearchDialog,
      componentProps: {
        dialogTitle: 'Insert Task Between Two Others',
        taskID: currentTaskID.value,
        searchLabel: 'Search',
        resultsTitle: 'Search Results',
        closeOnSelect: false,
        onSelect: insertBetweenPre,
        initialFilter: insertBetweenFilter,
        batchFilter: (taskID: number | undefined) => (tasks: Task[]) => {
          if (typeof taskID === 'undefined') {
            console.warn('task id is undefined')
            return []
          }
          const ct = useRepo(TaskRepo).withAll().find(taskID)
          if (ct === null) {
            console.warn('current task was not found (by id)')
            return []
          }
          const relationInfo = ct.anyIDsBelow(tasks.map((x) => x.id))
          if (currentPre === null) {
            console.warn('current prerequisite info was not passed in')
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
      action: (x: Task) => tr.removePre(currentTask.value, x.id)
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
      action: (x: Task) => tr.removePost(currentTask.value, x.id)
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

  const prunePosts = TDLAPP.blockingFunc(
    async (payload: { above: Set<number>; below: Set<number> }) => {
      useLoadingStateStore().busy = true
      const toRemove = allPosts.value.filter(
        (x) => payload.below.has(x.id) && !payload.above.has(x.id)
      )
      for (let i = 0; i < toRemove.length; i++) {
        await tr.removePost(currentTask.value, toRemove[i].id)
      }
      useLoadingStateStore().busy = false
    }
  )

  const prunePres = TDLAPP.blockingFunc(
    async (payload: { above: Set<number>; below: Set<number> }) => {
      const toRemove = allPres.value.filter((x) => {
        const hasRelationsAbove = payload.above.has(x.id)
        const hasRelationsBelow = payload.below.has(x.id)
        console.log({ hasRelationsAbove, hasRelationsBelow, x })
        return hasRelationsAbove && !hasRelationsBelow
      })
      console.log('pruning prerequisites', { payload, toRemove })
      for (let i = 0; i < toRemove.length; i++) {
        await tr.removePre(currentTask.value, toRemove[i].id)
      }
    }
  )
</script>
