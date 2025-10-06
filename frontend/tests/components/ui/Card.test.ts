import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Card from '@/components/ui/Card.vue'

describe('Card.vue', () => {
  const defaultProps = {}

  const mountCard = (props = {}, slots = {}) => {
    return mount(Card, {
      props: { ...defaultProps, ...props },
      slots,
    })
  }

  beforeEach(() => {
    // Clear any existing content
    document.body.innerHTML = ''
  })

  describe('Basic Rendering', () => {
    it('should render as div by default', () => {
      const wrapper = mountCard()
      expect(wrapper.element.tagName).toBe('DIV')
    })

    it('should render with correct base classes', () => {
      const wrapper = mountCard()
      expect(wrapper.classes()).toContain('bg-white')
      expect(wrapper.classes()).toContain('rounded-lg')
      expect(wrapper.classes()).toContain('shadow')
    })

    it('should render custom element when as prop is provided', () => {
      const wrapper = mountCard({ as: 'section' })
      expect(wrapper.element.tagName).toBe('SECTION')
    })

    it('should render with default content padding', () => {
      const wrapper = mountCard({}, { default: 'Test content' })
      const contentDiv = wrapper.find('.p-6')
      expect(contentDiv.exists()).toBe(true)
      expect(contentDiv.text()).toBe('Test content')
    })
  })

  describe('Padding Variants', () => {
    it('should apply no padding when padding is none', () => {
      const wrapper = mountCard({ padding: 'none' }, { default: 'Test content' })
      expect(wrapper.find('.p-6').exists()).toBe(false)
      expect(wrapper.find('.p-4').exists()).toBe(false)
      expect(wrapper.find('.p-8').exists()).toBe(false)
      
      // Content should still be in a div but with no padding class
      const contentDiv = wrapper.find('div')
      expect(contentDiv.text()).toBe('Test content')
    })

    it('should apply small padding when padding is sm', () => {
      const wrapper = mountCard({ padding: 'sm' }, { default: 'Test content' })
      const contentDiv = wrapper.find('.p-4')
      expect(contentDiv.exists()).toBe(true)
      expect(contentDiv.text()).toBe('Test content')
    })

    it('should apply medium padding by default', () => {
      const wrapper = mountCard({}, { default: 'Test content' })
      const contentDiv = wrapper.find('.p-6')
      expect(contentDiv.exists()).toBe(true)
      expect(contentDiv.text()).toBe('Test content')
    })

    it('should apply large padding when padding is lg', () => {
      const wrapper = mountCard({ padding: 'lg' }, { default: 'Test content' })
      const contentDiv = wrapper.find('.p-8')
      expect(contentDiv.exists()).toBe(true)
      expect(contentDiv.text()).toBe('Test content')
    })
  })

  describe('Interactive States', () => {
    it('should not have hover classes by default', () => {
      const wrapper = mountCard()
      expect(wrapper.classes()).not.toContain('hover:shadow-md')
      expect(wrapper.classes()).not.toContain('transition-all')
      expect(wrapper.classes()).not.toContain('cursor-pointer')
      expect(wrapper.classes()).not.toContain('group')
    })

    it('should apply hover styles when hoverable is true', () => {
      const wrapper = mountCard({ hoverable: true })
      expect(wrapper.classes()).toContain('hover:shadow-md')
      expect(wrapper.classes()).toContain('transition-all')
      expect(wrapper.classes()).toContain('group')
    })

    it('should apply cursor pointer when clickable is true', () => {
      const wrapper = mountCard({ clickable: true })
      expect(wrapper.classes()).toContain('cursor-pointer')
      expect(wrapper.classes()).toContain('group')
    })

    it('should apply both hover and cursor styles when both props are true', () => {
      const wrapper = mountCard({ hoverable: true, clickable: true })
      expect(wrapper.classes()).toContain('hover:shadow-md')
      expect(wrapper.classes()).toContain('transition-all')
      expect(wrapper.classes()).toContain('cursor-pointer')
      expect(wrapper.classes()).toContain('group')
    })
  })

  describe('Slot Rendering', () => {
    it('should render default slot content', () => {
      const wrapper = mountCard({}, {
        default: '<p>Main content</p>',
      })
      expect(wrapper.html()).toContain('<p>Main content</p>')
      expect(wrapper.text()).toContain('Main content')
    })

    it('should render header slot content', () => {
      const wrapper = mountCard({}, {
        header: '<h2>Card Header</h2>',
      })
      expect(wrapper.html()).toContain('<h2>Card Header</h2>')
      expect(wrapper.text()).toContain('Card Header')
    })

    it('should render actions slot content', () => {
      const wrapper = mountCard({}, {
        actions: '<button>Action</button>',
      })
      expect(wrapper.html()).toContain('<button>Action</button>')
      expect(wrapper.text()).toContain('Action')
    })

    it('should render all slots together', () => {
      const wrapper = mountCard({}, {
        header: '<h2>Header</h2>',
        default: '<p>Content</p>',
        actions: '<button>Action</button>',
      })
      
      expect(wrapper.text()).toContain('Header')
      expect(wrapper.text()).toContain('Content')
      expect(wrapper.text()).toContain('Action')
    })
  })

  describe('Slot Structure and Classes', () => {
    it('should apply correct header classes', () => {
      const wrapper = mountCard({ padding: 'md' }, {
        header: 'Header content',
      })
      
      // Header should have content padding + pb-0
      const headerDiv = wrapper.find('.p-6.pb-0')
      expect(headerDiv.exists()).toBe(true)
      expect(headerDiv.text()).toBe('Header content')
    })

    it('should apply correct header classes with different padding', () => {
      const wrapper = mountCard({ padding: 'sm' }, {
        header: 'Header content',
      })
      
      // Header should have sm padding + pb-0
      const headerDiv = wrapper.find('.p-4.pb-0')
      expect(headerDiv.exists()).toBe(true)
      expect(headerDiv.text()).toBe('Header content')
    })

    it('should apply correct actions classes', () => {
      const wrapper = mountCard({}, {
        actions: '<button>Action</button>',
      })
      
      // Actions should have specific classes from original design
      const actionsDiv = wrapper.find('.px-6.pb-4.flex.items-center.justify-end.space-x-2')
      expect(actionsDiv.exists()).toBe(true)
      expect(actionsDiv.html()).toContain('<button>Action</button>')
    })

    it('should not render empty slot containers', () => {
      const wrapper = mountCard({}, {
        default: 'Only content',
      })
      
      // Should not have header or actions divs
      expect(wrapper.find('.pb-0').exists()).toBe(false)
      expect(wrapper.find('.px-6.pb-4').exists()).toBe(false)
    })
  })

  describe('Props Integration', () => {
    it('should handle multiple props correctly', () => {
      const wrapper = mountCard(
        {
          as: 'article',
          hoverable: true,
          clickable: true,
          padding: 'lg',
        },
        {
          header: 'Article Header',
          default: 'Article Content',
          actions: '<button>Save</button>',
        }
      )
      
      // Check element type
      expect(wrapper.element.tagName).toBe('ARTICLE')
      
      // Check interactive classes
      expect(wrapper.classes()).toContain('hover:shadow-md')
      expect(wrapper.classes()).toContain('cursor-pointer')
      
      // Check padding
      expect(wrapper.find('.p-8').exists()).toBe(true)
      
      // Check all content
      expect(wrapper.text()).toContain('Article Header')
      expect(wrapper.text()).toContain('Article Content')
      expect(wrapper.text()).toContain('Save')
    })
  })

  describe('Attribute Inheritance', () => {
    it('should pass through additional attributes', () => {
      const wrapper = mountCard({
        'data-testid': 'test-card',
        'aria-label': 'Test Card',
      })
      
      expect(wrapper.attributes('data-testid')).toBe('test-card')
      expect(wrapper.attributes('aria-label')).toBe('Test Card')
    })

    it('should handle custom CSS classes via attributes', () => {
      const wrapper = mountCard({
        class: 'custom-card-class',
      })
      
      expect(wrapper.classes()).toContain('custom-card-class')
      expect(wrapper.classes()).toContain('bg-white')
      expect(wrapper.classes()).toContain('rounded-lg')
    })
  })

  describe('Shadow Prop', () => {
    it('should handle shadow prop when provided', () => {
      // Note: shadow prop is defined in the interface but not used in current implementation
      // This test documents the current behavior
      const wrapper = mountCard({ shadow: 'lg' })
      expect(wrapper.classes()).toContain('shadow')
    })
  })

  describe('Complex Content Scenarios', () => {
    it('should handle complex HTML in slots', () => {
      const wrapper = mountCard({}, {
        header: `
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">Complex Header</h3>
            <span class="text-sm text-gray-500">Subtitle</span>
          </div>
        `,
        default: `
          <div class="space-y-4">
            <p>First paragraph</p>
            <ul class="list-disc list-inside">
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
          </div>
        `,
        actions: `
          <button class="btn-secondary">Cancel</button>
          <button class="btn-primary">Save</button>
        `,
      })
      
      expect(wrapper.text()).toContain('Complex Header')
      expect(wrapper.text()).toContain('Subtitle')
      expect(wrapper.text()).toContain('First paragraph')
      expect(wrapper.text()).toContain('Item 1')
      expect(wrapper.text()).toContain('Cancel')
      expect(wrapper.text()).toContain('Save')
      
      // Check that HTML structure is preserved
      expect(wrapper.html()).toContain('class="flex items-center justify-between"')
      expect(wrapper.html()).toContain('class="space-y-4"')
      expect(wrapper.html()).toContain('<ul class="list-disc list-inside">')
    })

    it('should handle nested Vue components in slots', () => {
      const wrapper = mountCard({}, {
        header: 'Header with button',
        default: 'Content area',
        actions: '<button type="button">Action Button</button>',
      })
      
      expect(wrapper.find('button[type="button"]').exists()).toBe(true)
      expect(wrapper.find('button').text()).toBe('Action Button')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty slots gracefully', () => {
      const wrapper = mountCard({}, {
        header: '',
        default: '',
        actions: '',
      })
      
      // Vue treats empty string slots as existing, so containers will render
      // but they should be empty
      const headerDiv = wrapper.find('.pb-0')
      const contentDiv = wrapper.find('.p-6')
      const actionsDiv = wrapper.find('.px-6.pb-4')
      
      if (headerDiv.exists()) {
        expect(headerDiv.text().trim()).toBe('')
      }
      if (contentDiv.exists()) {
        expect(contentDiv.text().trim()).toBe('')
      }
      if (actionsDiv.exists()) {
        expect(actionsDiv.text().trim()).toBe('')
      }
    })

    it('should handle whitespace-only slots', () => {
      const wrapper = mountCard({}, {
        default: '   ',
      })
      
      // Whitespace-only content should still render the container
      const contentDiv = wrapper.find('.p-6')
      expect(contentDiv.exists()).toBe(true)
    })

    it('should work with no slots provided', () => {
      const wrapper = mountCard()
      
      expect(wrapper.element.tagName).toBe('DIV')
      expect(wrapper.classes()).toContain('bg-white')
      expect(wrapper.text()).toBe('')
    })
  })
})