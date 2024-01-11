<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized>
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Task Details</div>
        <template v-if="currentTask.completed !== true">
          <q-btn class="q-ma-sm" size="md" color="positive" label="Mark Complete" @click.stop="toggleComplete(currentTask as Task)"/>
        </template>
        <template v-else>
          <q-btn class="q-ma-sm" size="md" color="primary" label="Mark Incomplete" @click.stop="toggleComplete(currentTask as Task)"/>
        </template>
        <q-btn class="q-ma-sm" size="md" color="negative" label="Delete" @click="deleteTask(currentTask.title, currentTask as Task)" />
        <q-btn class="q-ma-sm" size="md" color="negative" label="DO ASAP" @click="ASAPify(currentTask as Task)" />
        <q-btn class="q-ma-sm" size="md" color="grey" label="Close" @click="onCancelClick" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12 col-md">
            <div class="text-h4 text-primary">{{ taskTitle }}</div>
            <q-input
              v-model="editTitle"
              filled
              label="Task Title"
              :placeholder="currentTask.title"
              @keyup.enter="updateTask({ title: editTitle })"
              clearable
              class="q-my-md"
            />
            <q-select
              v-model="selectedList"
              filled
              hide-selected
              fill-input
              input-debounce="20"
              :options="lists"
              option-label="title"
              map-options
              emit-value
              label="List"
              use-input
              @filter="filterSelection"
              @update:model-value="updateTask({ list_id: selectedList === null ? null : selectedList.id })"
              option-value="id"
              class="q-my-md text-primary"
            />
            <q-datetime-input
              v-model="editRemindMeAt"
              @update:model-value="updateTask({ remind_me_at: editRemindMeAt })"
              label="Remind me at"
              class="q-my-md"
            />
            <q-expansion-item 
              expand-separator 
              switch-toggle-side
              icon="fas fa-lightbulb"
              caption="Metadata"
              v-model="expandEnergyStats"
              @update:model-value="updateLocalSettings">
              <br>
              <q-list>
                <q-item class="q-my-sm">
                  <q-item-section side>
                    <q-icon name="far fa-tired" />
                  </q-item-section>

                  <q-item-section>
                    <div>
                      <!-- <q-badge>Mental Energy Required</q-badge> -->

                      <q-slider
                        v-model="editMentalEnergyRequired"
                        @change="updateTask({ mental_energy_required: editMentalEnergyRequired })"
                        :min="0"
                        :max="100"
                        :step="1"
                        label
                        label-always
                        :label-value="`Mental ${editMentalEnergyRequired}%`"
                        color="blue"
                      />
                    </div>
                  </q-item-section>

                  <q-item-section side>
                    <q-icon name="fas fa-lightbulb" />
                  </q-item-section>
                </q-item>

                <q-item class="q-my-sm">
                  <q-item-section side>
                    <q-icon name="far fa-tired" />
                  </q-item-section>

                  <q-item-section>
                    <div>
                      <!-- <q-badge color="red">Physical Energy Required</q-badge> -->

                      <q-slider
                        v-model="editPhysicalEnergyRequired"
                        @change="updateTask({ physical_energy_required: editPhysicalEnergyRequired })"
                        :min="0"
                        :max="100"
                        :step="1"
                        label
                        label-always
                        :label-value="`Physical ${editPhysicalEnergyRequired}%`"
                        color="red"
                      />
                    </div>
                  </q-item-section>

                  <q-item-section side>
                    <q-icon name="fas fa-dumbbell" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
            
            <br>
            <q-input
              v-model="editNotes"
              filled
              autogrow
              @update:model-value="updateTask({ notes: editNotes })"
              debounce="1000"
              label="Notes"
            />
          </div>

          <div class="col-12 col-md">
            <q-toggle v-model="incompleteOnly" @click="updateLocalSettings" label="Hide Completed Pres and Posts" class="text-primary" />
            <DependencyList 
            :items="allPres" 
            :dependency-type="preDepType" 
            :menu-items="prereqMenuItems" 
            @add-item="openPrerequisiteDialog"
            @remove-item="pre => removePrerequisite(pre)"
            @select-item="t => setCurrentTask(t)"
            @toggle-completed-item="t => updateTaskCompletedStatus(t)" />
            <DependencyList
            :items="allPosts"
            :dependency-type="postDepType"
            :menu-items="postreqMenuItems"
            @add-item="openPostrequisiteDialog"
            @remove-item="post => removePostrequisite(post)"
            @select-item="t => setCurrentTask(t)"
            @toggle-completed-item="t => updateTaskCompletedStatus(t)" />
            
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
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { computed, ref } from 'vue';

import DependencyList from './DependencyList.vue';


import QDatetimeInput from 'components/QDatetimeInput.vue';
import TaskSearchDialog from 'components/TaskSearchDialog.vue';

import { ListRepo } from 'src/stores/lists/list';
import { AllOptionalTaskProperties, Task, TaskRepo, UpdateTaskOptions } from 'src/stores/tasks/task';
import { Item, useRepo } from 'pinia-orm';
import { Utils } from 'src/util'
import { syncWithBackend } from 'src/hackerman/sync'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { useCurrentTaskStore } from 'src/stores/task-meta/current-task'

const emit = defineEmits([
  // REQUIRED; need to specify some events that your
  // component will emit through useDialogPluginComponent()
  ...useDialogPluginComponent.emits
])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
// dialogRef      - Vue ref to be applied to QDialog
// onDialogHide   - Function to be used as handler for @hide on QDialog
// onDialogOK     - Function to call to settle dialog with "ok" outcome
//                    example: onDialogOK() - no payload
//                    example: onDialogOK({ /*.../* }) - with payload
// onDialogCancel - Function to call to settle dialog with "cancel" outcome

const $q = useQuasar()
const listsRepo = useRepo(ListRepo)
const tr = useRepo(TaskRepo)
const usr = useLocalSettingsStore()
const ctr = useCurrentTaskStore()

const currentTaskID = computed((): number => Utils.hardCheck(ctr.id))
const currentTask = computed((): Task => Utils.hardCheck(tr.withAll().find(currentTaskID.value)))
currentTask.value.hard_postreqs.sort((a, b) => b.hard_postreq_ids.length - a.hard_postreq_ids.length)
currentTask.value.hard_prereqs.sort((a, b) => b.hard_postreq_ids.length - a.hard_postreq_ids.length)
console.debug('UpdateTaskDialog: task prop value: ', currentTask.value)
const taskID = computed(() => currentTask.value.id)
const taskTitle = computed(() => currentTask.value.title)
const updatedFlag = ref(false)

const editTitle = ref(currentTask.value.title)
const editNotes = ref(currentTask.value.notes)
const editRemindMeAt = ref(currentTask.value.remind_me_at)
const editMentalEnergyRequired = ref(currentTask.value.mental_energy_required)
const editPhysicalEnergyRequired = ref(currentTask.value.physical_energy_required)

const expandEnergyStats = ref(usr.expandEnergyStats)

const incompleteOnly = ref(usr.hideCompleted)
const updateLocalSettings = () => {
  usr.hideCompleted = incompleteOnly.value
  usr.expandEnergyStats = expandEnergyStats.value
}

const lists = computed(
  () => listsRepo.all()
)

const allPres = computed(() => {
  console.debug('refreshing allPres value')
  if(incompleteOnly.value) return currentTask.value.hard_prereqs.filter(x => !x.completed)
  return currentTask.value.hard_prereqs
})

const allPosts = computed(() => {
  console.debug('refreshing allPosts value')
  if(incompleteOnly.value) return currentTask.value.hard_postreqs.filter(x => !x.completed)
  return currentTask.value.hard_postreqs
})

const updateTaskCompletedStatus = (task: Task) => {
  tr.update({ id: Utils.hardCheck(task.id), payload: { task }})
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
  return (
    !!task.list ?
    { id: task.list.id, title: task.list.title } :
    null
  )
}

const selectedList = ref(getSelectedList(currentTask.value))

function setCurrentTask(newTask: Task) {
  console.debug('setCurrentTask')
  ctr.id = newTask.id
  editTitle.value = currentTask.value.title
  editNotes.value = currentTask.value.notes
  editRemindMeAt.value = currentTask.value.remind_me_at
  editMentalEnergyRequired.value = currentTask.value.mental_energy_required
  editPhysicalEnergyRequired.value = currentTask.value.physical_energy_required
  selectedList.value = getSelectedList(currentTask.value)
}

function deleteTask(title: string, task: Task) {
  $q.dialog({
    title: `Delete task: "${title}"`,
    message: 'This cannot be undone! Are you sure?',
    ok: {
      label: 'Delete',
      color: 'negative'
    },
    cancel: {
      color: 'grey'
    }
  }).onOk(
    () => {
      console.debug('deleting task')
      tr.deleteTask(task).then(
        Utils.handleSuccess('Deleted task', 'fa-solid fa-tasks'),
        Utils.handleError('Failed to delete task.')
      )
    }
  )
}

function updateTask(options: AllOptionalTaskProperties) {
  tr.update({id: currentTask.value.id ?? -1, payload: { task: options } })
  .then(() => {
    Utils.notifySuccess('Task Was Updated')
  }, Utils.handleError('Error updating task'))
}

function openPrerequisiteDialog() {
  $q.dialog({
    component: TaskSearchDialog,

    componentProps: {
      dialogTitle: 'Add Prerequisite',
      task: currentTask.value,

      onSelect: async (payload: { task: Task }) => {
        console.debug({payload})
        await addPrereq(payload.task)
      }
    }
  })
}

function openPostrequisiteDialog() {
  $q.dialog({
    component: TaskSearchDialog,

    componentProps: {
      dialogTitle: 'Add Postrequisite',
      task: currentTask.value,

      onSelect: async (payload: { task: Task }) => {
        console.debug({payload})
        await addPostreq(payload.task)
      },
    }
  })
}

const addPrereq = async (payload: Task) => {
  const payload_id = Utils.hardCheck(payload.id, 'addPrereq: id of prereq is null or undefined!')
  await tr.addPre(currentTask.value, payload_id)
  .then(
    () => {
      Utils.notifySuccess('Added Prerequisiste', 'fa-solid fa-link')
    },
    Utils.handleError('Failed to add prereq')
  )
}

const addPostreq = async (payload: Task) => {
  const payload_id = Utils.hardCheck(payload.id, 'addPrereq: id of postreq is null or undefined!')
  await tr.addPost(currentTask.value, payload_id).
  then(
    () => {
      Utils.notifySuccess('Added Postrequisite', 'fa-solid fa-link')
      tr.withAll().load([currentTask.value])
    },
    Utils.handleError('Failed to add postreq')
  )
}

const removePrerequisite = async (prereq: Task) => {
  const prereq_id = Utils.hardCheck(prereq.id, 'removePrerequisite: id of prereq is null or undefined!')
  await tr.removePre(currentTask.value, prereq_id)
  .then(Utils.handleSuccess('Removed Prerequisite', 'fa-solid fa-unlink'))
}

const removePostrequisite = async (postreq: Task) => {
  const postreq_id = Utils.hardCheck(postreq.id, 'removePostrequisite: id of postreq is null or undefined!')
  await tr.removePost(currentTask.value, postreq_id)
  .then(Utils.handleSuccess('Removed Postrequisite', 'fa-solid fa-unlink'))
}

const toggleComplete = async (task: Task) => {
  await tr.toggleCompleted(task)
  //Utils.handleSuccess(`Marked ${ task.completed ? 'Complete' : 'Incomplete'}`, 'fa-solid fa-check')
}

// other methods that we used in our vue html template;
// these are part of our example (so not required)
const onOKClick = onDialogOK

// we can passthrough onDialogCancel directly
const onCancelClick = onDialogCancel

const ASAPify = (task: Task) => {
  const allTasks = tr.withAll().get()
  const layerZero = allTasks.filter(x => !x.completed && x.id !== task.id && x.hard_prereqs.filter((y: Task) => !y.completed).length === 0)
  const taskID = Utils.hardCheck(task.id)
  for(let i = 0; i < layerZero.length; i++) {
    tr.addPre(layerZero[i], taskID).then(Utils.handleSuccess('Added a Next-Up as Post to This'), Utils.handleError('Error adding Rule for ASAPify'))
  }
  syncWithBackend().then(() => {
    Utils.notifySuccess('Refreshed All')
  }, Utils.handleError('Error Refreshing All'))
}

const mvpPostrequisite = (post: Task) => {
  console.debug(post)
  const allOtherPosts = allPosts.value.filter(x => !x.completed && x.id !== post.id)
  const currentTaskID = Utils.hardCheck(currentTask.value.id)
  const postID = Utils.hardCheck(post.id)
  allOtherPosts.forEach(x => {
    tr.removePre(x, currentTaskID).then(Utils.handleSuccess('removed redundant prerequisite'), Utils.handleError('error removing redundant prerequisite'))
  })
  allOtherPosts.forEach(x => {
    tr.addPre(x, postID).then(() => {
      Utils.notifySuccess('added new post to MVP!')
    }, Utils.handleError('error adding new post to MVP!'))
  })
  syncWithBackend().then(() => {
    Utils.notifySuccess('Refreshed All')
  }, Utils.handleError('Error Refreshing All'))
}

const preDepType = { plural: 'Prerequisites', singular: 'Prerequisite' } as const
const postDepType = { plural: 'Postrequisites', singular: 'Postrequisite' } as const

const prereqMenuItems = [
  {
    label: 'Unlink this Prerequisite',
    icon: 'fas fa-unlink',
    action: removePrerequisite
  }
]

const postreqMenuItems = [
  {
    label: 'Unlink this Postrequisite',
    icon: 'fas fa-unlink',
    action: removePostrequisite
  },
  {
    label: 'Move all Postreqs from Current Task to This Task',
    icon: 'fas fa-triangle-exclamation',
    action: mvpPostrequisite
  }
]

</script>
