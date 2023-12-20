// @ts-check
'use strict'

const dom = {}
const SECOND = 1000

dom.defaultTimeout = 5 * SECOND

/**
 * @param {Element | HTMLElement} element
 */
function isStyleVisible (element) {
  const ownerDocument = element.ownerDocument
  if (!ownerDocument || !ownerDocument.defaultView) {
    console.warn('invalid element?', element)
    throw new Error('element has no ownerDocument')
  }

  const {
    display,
    visibility,
    opacity
  } = ownerDocument.defaultView.getComputedStyle(element)

  return (
    display !== 'none' &&
    visibility !== 'hidden' &&
    visibility !== 'collapse' &&
    opacity !== '0' &&
    Number(opacity) !== 0
  )
}

/**
 * @param {Element | HTMLElement} element
 */
dom.getComputedStyle = element => {
  const ownerDocument = element.ownerDocument

  if (!ownerDocument || !ownerDocument.defaultView) {
    console.warn('invalid element?', element)
    throw new Error('element has no ownerDocument')
  }

  return ownerDocument.defaultView.getComputedStyle(element)
}

/**
 * @param {Element | HTMLElement} element
 * @param {Element | HTMLElement} [previousElement]
 */
function isAttributeVisible (element, previousElement) {
  return (
    !element.hasAttribute('hidden') &&
    (element.nodeName === 'DETAILS' && previousElement?.nodeName !== 'SUMMARY'
      ? element.hasAttribute('open')
      : true)
  )
}

/**
 * Copy pasted from https://raw.githubusercontent.com/testing-library/jest-dom/master/src/to-be-visible.js
 * @param {Element | HTMLElement} element
 * @param {Element | HTMLElement} [previousElement]
 * @returns {boolean}
 */
dom.isElementVisible = (element, previousElement) => {
  return (
    isStyleVisible(element) &&
    isAttributeVisible(element, previousElement) &&
    (!element.parentElement || dom.isElementVisible(element.parentElement, element))
  )
}

/** @param {{
 *    text?: string,
 *    timeout?: number
 *    element: Element,
 *    multipleTags?: Boolean,
 *    regex?: RegExp
 * }} args
 */
dom.waitForText = args => {
  return dom.waitFor({
    timeout: args.timeout
  }, () => {
    const {
      element,
      text,
      regex,
      multipleTags
    } = args

    const elems = []

    let maxLoop = 10000
    const stack = [element]
    // Walk the DOM tree breadth first and build up a list of
    // elements with the leafs last.
    while (stack.length > 0 && maxLoop-- >= 0) {
      const current = stack.pop()
      if (current && current.children.length > 0) {
        stack.push(...current.children)
        elems.push(...current.children)
      }
    }

    // Loop over children in reverse to scan the LEAF nodes first.
    let match = null
    for (let i = elems.length - 1; i >= 0; i--) {
      const node = elems[i]
      if (!node.textContent) continue

      if (regex && regex.test(node.textContent)) {
        return node
      }

      if (text && node.textContent?.includes(text)) {
        return node
      }

      if (text && multipleTags) {
        if (text[0] !== (node.textContent)[0]) continue

        // if equal, check the sibling nodes
        let sibling = node.nextSibling
        let i = 1

        // while there is a potential match, keep checking the siblings
        while (i < text.length) {
          if (sibling && (sibling.textContent == text[i])) {
            // is equal still, check the next sibling
            sibling = sibling.nextSibling
            i++
            match = node.parentElement
          } else {
            if (i === (text.length - 1)) return node.parentElement
            match = null
            break
          }
        }
      }
    }

    return match
  })
}

/**
 * @param {{
 *    selector?: string,
 *    visible?: boolean, // the element needs to be visible
 *    timeout?: number // how long to wait
 * }} args
 * @param {() => HTMLElement | Element | null | undefined} [lambda]
 */
dom.waitFor = (args, lambda) => {
  return new Promise((resolve, reject) => {
    const {
      selector,
      visible = true,
      timeout = dom.defaultTimeout
    } = args

    if (!lambda && selector) {
      lambda = () => document.querySelector(selector)
    }

    const interval = setInterval(() => {
      if (!lambda) {
        throw new Error('lambda or selector required')
      }

      const el = lambda()
      if (el) {
        if (visible && !dom.isElementVisible(el)) return
        clearTimeout(timer)
        return resolve(el)
      }
    }, 50)

    const timer = setTimeout(() => {
      clearInterval(interval)
      const wantsVisable = visible ? 'A visible selector' : 'A Selector'
      reject(new Error(`${wantsVisable} was not found after ${timeout}ms (${selector})`))
    }, timeout)
  })
}

/**
 * @param {Element | HTMLElement} element
 */
dom.click = element => {
  dom.event({
    event: new window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      button: 0
    }),
    element
  })
}

/**
 * @param {{
 *   event: string | Event,
 *   element?: HTMLElement | Element | window
 * }} args
 */
dom.event = args => {
  let {
    event,
    element = window
  } = args

  if (typeof event === 'string') {
    event = new window.CustomEvent(event)
  }

  if (typeof event !== 'object') {
    throw new Error('event should be of type Event')
  }

  element.dispatchEvent(event)
}

/**
 * @param {string} selector
 * @returns {HTMLElement| null}
 */
dom.qs = (selector) => {
  return document.querySelector(selector)
}

/**
 * @param {string} selector
 * @returns {Array<HTMLElement>}
 */
dom.qsa = (selector) => {
  /** @type {NodeListOf<HTMLElement>} */
  const elems = document.querySelectorAll(selector)
  return [...elems]
}
