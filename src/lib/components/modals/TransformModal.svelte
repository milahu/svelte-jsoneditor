<svelte:options immutable={true} />

<script>
  import { uniqueId } from '../../utils/uniqueId.js'
  import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons'
  import { debounce, isEmpty, noop } from 'lodash-es'
  import { getContext } from 'svelte'
  import Icon from 'svelte-awesome'
  import { DEBOUNCE_DELAY } from '../../constants.js'
  import { compileJSONPointer, getIn } from 'immutable-json-patch'
  import { stringifyPath } from '../../utils/pathUtils.js'
  import { transformModalState } from './transformModalState.js'
  import TransformWizard from './TransformWizard.svelte'
  import TransformModalHeader from './TransformModalHeader.svelte'
  import AbsolutePopup from './popup/AbsolutePopup.svelte'
  import { createDebug } from '../../utils/debug'
  import TreeMode from '../modes/treemode/TreeMode.svelte'

  const debug = createDebug('jsoneditor:TransformModal')

  export let id = 'transform-modal-' + uniqueId()
  export let json
  export let selectedPath = []

  export let escapeControlCharacters
  export let escapeUnicodeCharacters

  /** @type {QueryLanguage[]} */
  export let queryLanguages

  /** @type {string} */
  export let queryLanguageId

  /** @type {(queryLanguageId: string) => void} */
  export let onChangeQueryLanguage

  /** @type {(props: RenderValueProps) => RenderValueConstructor[]} */
  export let onRenderValue
  export let onClassName

  export let onTransform

  $: selectedJson = getIn(json, selectedPath)
  $: selectedContent = { json: selectedJson }

  const { close } = getContext('simple-modal')

  const stateId = `${id}:${compileJSONPointer(selectedPath)}`

  const state = transformModalState[stateId] || {}

  // showWizard is not stored inside a stateId
  let showWizard = transformModalState.showWizard !== false
  let showOriginal = transformModalState.showOriginal !== false

  let queryOptions = state.queryOptions || {}
  let query =
    queryLanguageId === state.queryLanguageId && state.query
      ? state.query
      : getSelectedQueryLanguage(queryLanguageId).createQuery(json, state.queryOptions || {})
  let isManual = state.isManual || false

  let previewError = undefined
  let previewContent = { text: '' }

  function getSelectedQueryLanguage(queryLanguageId) {
    return queryLanguages.find((item) => item.id === queryLanguageId) || queryLanguages[0]
  }

  function updateQueryByWizard(newQueryOptions) {
    queryOptions = newQueryOptions
    query = getSelectedQueryLanguage(queryLanguageId).createQuery(json, newQueryOptions)
    isManual = false

    debug('updateQueryByWizard', { queryOptions, query, isManual })
  }

  function handleChangeQuery(event) {
    query = event.target.value
    isManual = true
    debug('handleChangeQuery', { query, isManual })
  }

  function previewTransform(json, query) {
    try {
      debug('previewTransform', {
        query
      })
      const jsonTransformed = getSelectedQueryLanguage(queryLanguageId).executeQuery(json, query)

      previewContent = { json: jsonTransformed }
      previewError = undefined
    } catch (err) {
      previewContent = { text: '' }
      previewError = err
    }
  }

  const previewTransformDebounced = debounce(previewTransform, DEBOUNCE_DELAY)

  $: {
    previewTransformDebounced(selectedJson, query)
  }

  $: {
    // remember the selected values for the next time we open the SortModal
    // just in memory, not persisted
    transformModalState[stateId] = {
      queryOptions,
      query,
      queryLanguageId,
      isManual
    }

    debug('store state in memory', stateId, transformModalState[stateId])
  }

  function handleTransform() {
    try {
      debug('handleTransform', { query })
      const jsonTransformed = getSelectedQueryLanguage(queryLanguageId).executeQuery(
        selectedJson,
        query
      )

      onTransform([
        {
          op: 'replace',
          path: compileJSONPointer(selectedPath),
          value: jsonTransformed
        }
      ])

      close()
    } catch (err) {
      // this should never occur since we can only press the Transform
      // button when creating a preview was successful
      console.error(err)
      previewContent = { text: '' }
      previewError = err.toString()
    }
  }

  function toggleShowWizard() {
    showWizard = !showWizard

    // not stored inside a stateId
    transformModalState.showWizard = showWizard
  }

  function toggleShowOriginal() {
    showOriginal = !showOriginal

    // not stored inside a stateId
    transformModalState.showOriginal = showOriginal
  }

  function focus(element) {
    element.focus()
  }

  function handleChangeQueryLanguage(newQueryLanguageId) {
    debug('handleChangeQueryLanguage', newQueryLanguageId)
    queryLanguageId = newQueryLanguageId
    onChangeQueryLanguage(newQueryLanguageId)

    const newSelectedQueryLanguage = getSelectedQueryLanguage(queryLanguageId)
    query = newSelectedQueryLanguage.createQuery(json, queryOptions)
    isManual = false
  }
</script>

<div class="jsoneditor-modal transform">
  <AbsolutePopup>
    <TransformModalHeader
      {queryLanguages}
      {queryLanguageId}
      onChangeQueryLanguage={handleChangeQueryLanguage}
    />
    <div class="contents">
      <div class="main-contents">
        <div class="query-contents">
          <div class="label">
            <div class="label-inner">Language</div>
          </div>
          <div class="description">
            {@html getSelectedQueryLanguage(queryLanguageId).description}
          </div>

          <div class="label">
            <div class="label-inner">Path</div>
          </div>
          <input
            class="path"
            type="text"
            readonly
            title="Selected path"
            value={!isEmpty(selectedPath) ? stringifyPath(selectedPath) : '(whole document)'}
          />

          <div class="label">
            <div class="label-inner">
              <button type="button" on:click={toggleShowWizard}>
                <Icon data={showWizard ? faCaretDown : faCaretRight} />
                Wizard
              </button>
            </div>
          </div>
          {#if showWizard}
            {#if Array.isArray(selectedJson)}
              <TransformWizard {queryOptions} json={selectedJson} onChange={updateQueryByWizard} />
            {:else}
              (Only available for arrays, not for objects)
            {/if}
          {/if}

          <div class="label">
            <div class="label-inner">Query</div>
          </div>
          <textarea class="query" spellcheck="false" value={query} on:input={handleChangeQuery} />
        </div>
        <div class="data-contents" class:hide-original-data={!showOriginal}>
          <!--          <div class="query-data" class:hide-original={!showOriginal}>-->
          <div class="original-data" class:hide={!showOriginal}>
            <div class="label">
              <div class="label-inner">
                <button type="button" on:click={toggleShowOriginal}>
                  <Icon data={showOriginal ? faCaretDown : faCaretRight} />
                  Original
                </button>
              </div>
            </div>
            {#if showOriginal}
              <TreeMode
                externalContent={selectedContent}
                readOnly={true}
                mainMenuBar={false}
                navigationBar={false}
                {escapeControlCharacters}
                {escapeUnicodeCharacters}
                {onRenderValue}
                onError={console.error}
                onChange={noop}
                onFocus={noop}
                onBlur={noop}
                onSortModal={noop}
                onTransformModal={noop}
                {onClassName}
              />
            {/if}
          </div>
          <div class="preview-data">
            <div class="label">
              <div class="label-inner">Preview</div>
            </div>
            {#if !previewError}
              <TreeMode
                externalContent={previewContent}
                readOnly={true}
                mainMenuBar={false}
                navigationBar={false}
                {escapeControlCharacters}
                {escapeUnicodeCharacters}
                {onRenderValue}
                onError={console.error}
                onChange={noop}
                onFocus={noop}
                onBlur={noop}
                onSortModal={noop}
                onTransformModal={noop}
                {onClassName}
              />
            {:else}
              <div class="preview error">
                {previewError.toString()}
              </div>
            {/if}
          </div>
          <!--          </div>-->
        </div>
      </div>

      <div class="actions">
        <button
          type="button"
          class="primary"
          on:click={handleTransform}
          use:focus
          disabled={!!previewError}
        >
          Transform
        </button>
      </div>
    </div>
  </AbsolutePopup>
</div>

<style src="./TransformModal.scss"></style>
