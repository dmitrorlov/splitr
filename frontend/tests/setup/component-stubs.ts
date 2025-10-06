import { defineComponent, h } from 'vue'

// Enhanced component stubs that properly handle props and events
export const componentStubs = {
  Card: defineComponent({
    name: 'Card',
    props: {
      hoverable: Boolean,
      clickable: Boolean,
      padding: String,
      shadow: String,
    },
    emits: ['click'],
    template: `
      <div data-testid="card" 
           :hoverable="hoverable" 
           :clickable="clickable"
           :class="$attrs.class"
           @click="$emit('click')">
        <div data-testid="card-header" v-if="$slots.header">
          <slot name="header"/>
        </div>
        <div data-testid="card-body">
          <slot/>
        </div>
        <div data-testid="card-actions" v-if="$slots.actions">
          <slot name="actions"/>
        </div>
      </div>
    `,
  }),

  Select: defineComponent({
    name: 'Select',
    props: {
      modelValue: [String, Number],
      options: Array,
      loading: Boolean,
      error: String,
      label: String,
      placeholder: String,
      loadingText: String,
      emptyText: String,
      required: Boolean,
    },
    emits: ['update:model-value'],
    template: `
      <div data-testid="select-wrapper">
        <label v-if="label">{{ label }}</label>
        <select 
          data-testid="select"
          :value="modelValue"
          @change="$emit('update:model-value', $event.target.value)"
        >
          <option value="">{{ placeholder }}</option>
          <option 
            v-for="option in options" 
            :key="option.value" 
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <div v-if="error" data-testid="error">{{ error }}</div>
        <div v-if="loading" data-testid="loading">{{ loadingText }}</div>
        <div v-if="!loading && options?.length === 0" data-testid="empty">{{ emptyText }}</div>
      </div>
    `,
  }),

  Button: defineComponent({
    name: 'Button',
    props: {
      type: {
        type: String,
        default: 'button'
      },
      variant: String,
      loading: Boolean,
      disabled: Boolean,
    },
    emits: ['click'],
    template: `
      <button 
        :type="type"
        :disabled="disabled || loading"
        data-testid="button"
        @click="$emit('click')"
      >
        <slot/>
      </button>
    `,
  }),

  Input: defineComponent({
    name: 'Input',
    props: {
      modelValue: [String, Number],
      type: {
        type: String,
        default: 'text'
      },
      label: String,
      placeholder: String,
      error: String,
      required: Boolean,
      disabled: Boolean,
      readonly: Boolean,
    },
    emits: ['update:model-value'],
    template: `
      <div data-testid="input-wrapper">
        <label v-if="label">{{ label }}</label>
        <input 
          data-testid="input"
          :type="type"
          :value="modelValue"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          @input="$emit('update:model-value', $event.target.value)"
        />
        <div v-if="error" data-testid="error">{{ error }}</div>
      </div>
    `,
  }),

  PlusIcon: defineComponent({
    name: 'PlusIcon',
    template: `<svg data-testid="plus-icon" class="w-4 h-4"></svg>`,
  }),

  CloudIcon: defineComponent({
    name: 'CloudIcon',
    template: `<svg data-testid="cloud-icon" class="w-8 h-8"></svg>`,
  }),

  ArrowRightIcon: defineComponent({
    name: 'ArrowRightIcon',
    template: `<svg data-testid="arrow-right-icon" class="w-4 h-4"></svg>`,
  }),

  TrashIcon: defineComponent({
    name: 'TrashIcon',
    template: `<svg data-testid="trash-icon" class="w-4 h-4"></svg>`,
  }),

  ArrowPathIcon: defineComponent({
    name: 'ArrowPathIcon',
    template: `<svg data-testid="arrow-path-icon" class="w-3 h-3"></svg>`,
  }),
}