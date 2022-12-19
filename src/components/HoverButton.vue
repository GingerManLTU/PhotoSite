<template>
    <div class="text-center">
        <v-menu open-on-hover>
            <template v-slot:activator="{ props }">
                <v-btn color="lightblue" v-bind="props">
                    <slot> Dropdown</slot>
                </v-btn>
            </template>

            <v-list>
                <v-list-item v-for="(item, index) in props.buttonData" :key="index" @click="handleClick(index)">
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>
    </div>
</template>
<script setup>
import { ref } from 'vue'

const data = ref([])
const props = defineProps(['buttonData'])
const emit = defineEmits(['button-selected'])

const handleClick = (index) => {
    emit('button-selected', index)
}
</script>
