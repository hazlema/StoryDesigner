<script lang="ts">
    import { onMount, onDestroy } from "svelte"
    import { EditorView } from "prosemirror-view"
    import { EditorState } from "prosemirror-state"
    import { schema, defaultMarkdownParser, defaultMarkdownSerializer } from "prosemirror-markdown"
    import { history, undo, redo } from "prosemirror-history"
    import { keymap } from "prosemirror-keymap"
    import { baseKeymap, toggleMark, setBlockType, chainCommands, exitCode, wrapIn, lift } from "prosemirror-commands"

    let editorContainer: HTMLDivElement | null = null
    let currentView: MarkdownView | ProseMirrorView | null = null
    let viewMode: "markdown" | "wysiwyg" = $state("wysiwyg")

    // Svelte 5 runes: receive props via $props(); define bindable `markdown`
    let { onChange = (_: { markdown: string }) => {}, markdown = $bindable("") } = $props<{
        onChange?: (payload: { markdown: string }) => void
        markdown?: string
    }>()

    function clearFormatting() {
        if (currentView instanceof ProseMirrorView) {
            const view = currentView.view
            const { state } = view
            const { selection } = state

            if (!selection.empty) {
                // Remove all marks from the selected text by passing null
                let tr = state.tr.removeMark(selection.from, selection.to, null)

                // Also convert any block-level formatting (headers, code blocks, etc.) to paragraphs
                const fromPos = selection.$from
                const toPos = selection.$to
                const blockRange = fromPos.blockRange(toPos)

                if (blockRange) {
                    tr = tr.setBlockType(blockRange.start, blockRange.end, schema.nodes.paragraph)
                }

                // Use the view's dispatch method directly
                view.dispatch(tr)
            }
        }
    }

    class MarkdownView {
        private textarea: HTMLTextAreaElement

        constructor(target: HTMLElement, content: string) {
            this.textarea = target.appendChild(document.createElement("textarea"))
            this.textarea.value = content
            this.textarea.className = "markdown-textarea"
            this.textarea.placeholder = "Write your markdown here..."

            // Add event listener for content changes
            this.textarea.addEventListener("input", () => {
                const content = this.textarea.value
                markdown = content
                onChange?.({ markdown: content })
            })
        }

        get content(): string {
            return this.textarea.value
        }

        focus(): void {
            this.textarea.focus()
        }

        destroy(): void {
            this.textarea.remove()
        }
    }

    class ProseMirrorView {
        public view: EditorView

        constructor(target: HTMLElement, content: string) {
            this.view = new EditorView(target, {
                state: EditorState.create({
                    doc: defaultMarkdownParser.parse(content),
                    plugins: [
                        history(),
                        keymap({
                            "Mod-z": undo,
                            "Mod-y": redo,
                            "Shift-Mod-z": redo,
                            "Mod-b": toggleMark(schema.marks.strong),
                            "Mod-i": toggleMark(schema.marks.em),
                            "Mod-`": setBlockType(schema.nodes.code_block),
                            "Mod-Enter": chainCommands(exitCode),
                        }),
                        keymap(baseKeymap),
                    ],
                }),
                dispatchTransaction: (tr) => {
                    const newState = this.view.state.apply(tr)
                    this.view.updateState(newState)
                    const md = defaultMarkdownSerializer.serialize(newState.doc)
                    markdown = md
                    onChange?.({ markdown: md })
                },
            })
        }

        get content(): string {
            return defaultMarkdownSerializer.serialize(this.view.state.doc)
        }

        focus(): void {
            this.view.focus()
        }

        destroy(): void {
            this.view.destroy()
        }
    }

    function switchView(mode: "markdown" | "wysiwyg"): void {
        if (!editorContainer) return

        // Don't switch if we're already in the requested mode
        if (
            currentView &&
            ((mode === "markdown" && currentView instanceof MarkdownView) || (mode === "wysiwyg" && currentView instanceof ProseMirrorView))
        ) {
            return
        }

        // Get current content before destroying view
        const content = currentView?.content || markdown || ""

        // Destroy current view
        if (currentView) {
            currentView.destroy()
        }

        // Clear container
        editorContainer.innerHTML = ""

        // Create new view
        const ViewClass = mode === "markdown" ? MarkdownView : ProseMirrorView
        currentView = new ViewClass(editorContainer, content)
        viewMode = mode

        // Focus the new view
        currentView.focus()
    }

    onMount(() => {
        if (!editorContainer) return
		if (!markdown) {
			// To insert returns in markdown '<space><space>\n'
			markdown = "# **😮‍💨 No markdown bindable prop found!**";
		}

        // Initialize with WYSIWYG view by default
        const initialContent = markdown || ""
        currentView = new ProseMirrorView(editorContainer, initialContent)

        // Emit initial markdown
        const initialMarkdown = currentView.content
        markdown = initialMarkdown
        onChange?.({ markdown: initialMarkdown })
    })

    onDestroy(() => {
        if (currentView) {
            currentView.destroy()
            currentView = null
        }
    })
</script>

<div id="ProseMirror">
    <div class="toolbar" role="toolbar" aria-label="Editor toolbar">
        <div class="group">
            <button
                class="icon"
                onclick={() => currentView instanceof ProseMirrorView && undo(currentView.view.state, currentView.view.dispatch)}
                title="Undo"
                aria-label="Undo"
                data-action="undo">⟲</button
            >
            <button
                class="icon"
                onclick={() => currentView instanceof ProseMirrorView && redo(currentView.view.state, currentView.view.dispatch)}
                title="Redo"
                aria-label="Redo"
                data-action="redo">⟳</button
            >
        </div>
        <div class="divider"></div>
        <div class="group">
            <button
                class="icon"
                onclick={() =>
                    currentView instanceof ProseMirrorView && toggleMark(schema.marks.strong)(currentView.view.state, currentView.view.dispatch)}
                title="Bold"
                aria-label="Bold"
                data-action="bold"><strong>B</strong></button
            >
            <button
                class="icon"
                onclick={() =>
                    currentView instanceof ProseMirrorView && toggleMark(schema.marks.em)(currentView.view.state, currentView.view.dispatch)}
                title="Italic"
                aria-label="Italic"
                data-action="italic"><em>I</em></button
            >
            <button
                class="icon"
                onclick={() =>
                    currentView instanceof ProseMirrorView &&
                    setBlockType(schema.nodes.code_block)(currentView.view.state, currentView.view.dispatch)}
                title="Code block"
                aria-label="Code block"
                data-action="code">{`{}`}</button
            >
        </div>
        <div class="divider"></div>
        <div class="group">
            <button
                class="icon"
                onclick={() =>
                    currentView instanceof ProseMirrorView && setBlockType(schema.nodes.paragraph)(currentView.view.state, currentView.view.dispatch)}
                title="Paragraph"
                aria-label="Paragraph"
                data-action="paragraph">¶</button
            >
            <button
                class="icon"
                onclick={() =>
                    currentView instanceof ProseMirrorView &&
                    setBlockType(schema.nodes.heading, { level: 1 })(currentView.view.state, currentView.view.dispatch)}
                title="Heading 1"
                aria-label="Heading 1"
                data-action="h1">H1</button
            >
            <button
                class="icon"
                onclick={() =>
                    currentView instanceof ProseMirrorView &&
                    setBlockType(schema.nodes.heading, { level: 2 })(currentView.view.state, currentView.view.dispatch)}
                title="Heading 2"
                aria-label="Heading 2"
                data-action="h2">H2</button
            >
        </div>
        <div class="divider"></div>
        <div class="group">
            <button
                class="icon"
                onclick={() =>
                    currentView instanceof ProseMirrorView && wrapIn(schema.nodes.blockquote)(currentView.view.state, currentView.view.dispatch)}
                title="Blockquote"
                aria-label="Blockquote"
                data-action="blockquote">❝❞</button
            >
            <button
                class="icon"
                onclick={() => currentView instanceof ProseMirrorView && lift(currentView.view.state, currentView.view.dispatch)}
                title="Lift (outdent)"
                aria-label="Lift"
                data-action="lift">⇤</button
            >
        </div>
        <div class="divider"></div>
        <div class="group">
            <button class="icon" onclick={clearFormatting} title="Clear formatting" aria-label="Clear formatting" data-action="clear">⊘</button>
        </div>
        <div class="view-switcher">
            <label class="switcher-option">
                <input type="radio" name="viewMode" value="markdown" bind:group={viewMode} onchange={() => switchView("markdown")} />
                <span class="switcher-label">MD</span>
            </label>
            <label class="switcher-option">
                <input type="radio" name="viewMode" value="wysiwyg" bind:group={viewMode} onchange={() => switchView("wysiwyg")} />
                <span class="switcher-label">WYS</span>
            </label>
        </div>
    </div>
    <div class="editor">
        <div bind:this={editorContainer}></div>
    </div>
</div>

<style>
    /* CSS Isolation - Prevent external styles from interfering */
    :global(#ProseMirror) {
        /* CSS containment to isolate the component */
        contain: layout style;
        /* Reset any inherited styles */
        all: initial;
        /* Ensure our styles take precedence */
        font-family: "Source Sans Pro", "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        width: 100% !important;
        height: 100% !important;
        text-align: left !important;
        outline: none !important;
        overflow: hidden !important;
        border-radius: 8px !important;
        box-sizing: border-box !important;
    }

    /* Use higher specificity to override external styles */
    :global(#ProseMirror p) {
        margin: 0.75rem 0 !important;
        padding: 0 !important;
        line-height: inherit !important;
    }

    :global(#ProseMirror h1) {
        font-size: 2rem !important;
        font-weight: 700 !important;
        margin: 1.5rem 0 0.75rem !important;
        padding: 0 !important;
        line-height: inherit !important;
    }

    :global(#ProseMirror h2) {
        font-size: 1.5rem !important;
        font-weight: 600 !important;
        margin: 1.25rem 0 0.5rem !important;
        padding: 0 !important;
        line-height: inherit !important;
    }

    :global(#ProseMirror h3) {
        font-size: 1rem !important;
        font-weight: 500 !important;
        margin: 1rem 0 0.25rem !important;
        padding: 0 !important;
        line-height: inherit !important;
    }

    :global(#ProseMirror ul),
    :global(#ProseMirror ol) {
        padding-left: 1.5rem !important;
        margin: 0.75rem 0 !important;
        list-style: inherit !important;
    }

    :global(#ProseMirror blockquote) {
        border-left: 4px solid #d1d5db !important;
        padding-left: 1rem !important;
        color: #4b5563 !important;
        margin: 1rem 0 !important;
        font-style: italic !important;
    }

    :global(#ProseMirror code) {
        font-family: monospace !important;
        padding: 0.15rem 0.4rem !important;
        border-radius: 4px !important;
        font-size: 0.95em !important;
        background: #f3f4f6 !important;
    }

    :global(#ProseMirror pre) {
        padding: 1rem !important;
        border-radius: 6px !important;
        overflow: auto !important;
        font-family: monospace !important;
        font-size: 0.95em !important;
        color: black !important;
    }

    :global(#ProseMirror .editor pre) {
        background: #a6a8ad !important;
    }

    :global(#ProseMirror pre code) {
        padding: 0 !important;
        background: none !important;
    }

    :global(#ProseMirror .toolbar) {
        display: flex !important;
        align-items: center !important;
        padding: 8px 12px !important;
        background: #f9fafb !important;
        border-bottom: 1px solid #e5e7eb !important;
        border-top-left-radius: 8px !important;
        border-top-right-radius: 8px !important;
        box-sizing: border-box !important;
    }

    :global(#ProseMirror .group) {
        display: inline-flex !important;
        border: 1px solid #d1d5db !important;
        border-radius: 6px !important;
        overflow: hidden !important;
        background: white !important;
    }

    :global(#ProseMirror .toolbar .icon) {
        appearance: none !important;
        border: none !important;
        border-right: 1px solid #e5e7eb !important;
        background: transparent !important;
        padding: 0.5rem 0.75rem !important;
        color: #374151 !important;
        cursor: pointer !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-width: 2.5rem !important;
        transition:
            background 0.2s ease,
            color 0.2s ease,
            transform 0.1s ease !important;
        font: inherit !important;
        font-size: inherit !important;
        line-height: 1 !important;
        text-decoration: none !important;
        box-sizing: border-box !important;
    }

    :global(#ProseMirror .toolbar .group .icon:last-child) {
        border-right: none !important;
    }

    :global(#ProseMirror .toolbar .icon:hover) {
        background: #f3f4f6 !important;
        color: #1f2937 !important;
    }

    :global(#ProseMirror .toolbar .icon:active) {
        transform: scale(0.98) !important;
    }

    :global(#ProseMirror .toolbar .icon:focus) {
        outline: none !important;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
    }

    :global(#ProseMirror .toolbar .divider) {
        width: 1px !important;
        height: 28px !important;
        background: #d1d5db !important;
        margin: 0 0.75rem !important;
    }

    :global(#ProseMirror .editor) {
        background-color: white !important;
        color: black !important;
        font-size: 1rem !important;
        padding-right: 1rem !important;
        padding-left: 1rem !important;
        padding-top: 0.15rem !important;
        padding-bottom: 0.25rem !important;
        border-bottom-left-radius: 8px !important;
        border-bottom-right-radius: 8px !important;
        box-sizing: border-box !important;
        /* Preserve whitespace in the editor */
        white-space: pre-wrap !important;
    }

    :global(#ProseMirror textarea) {
        border: none !important;
        width: 100% !important;
        height: auto !important;
        min-height: 200px !important;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace !important;
        font-size: 0.95rem !important;
        line-height: 1.6 !important;
        color: #111827 !important;
        background: white !important;
        resize: vertical !important;
        outline: none !important;
        box-sizing: border-box !important;
        /* Preserve whitespace in markdown textarea */
        white-space: pre !important;
    }

    :global(#ProseMirror .view-switcher) {
        display: inline-flex !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 6px !important;
        overflow: hidden !important;
        background: white !important;
        margin-left: auto !important;
    }

    :global(#ProseMirror .switcher-option) {
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 0.5rem 0.75rem !important;
        background: transparent !important;
        border: none !important;
        font: inherit !important;
        font-weight: 500 !important;
        color: #6b7280 !important;
        transition: all 0.15s ease-in-out !important;
        min-width: 2.5rem !important;
        text-decoration: none !important;
        box-sizing: border-box !important;
    }

    :global(#ProseMirror .switcher-option:hover) {
        background: #f3f4f6 !important;
        color: #374151 !important;
    }

    :global(#ProseMirror .switcher-option input[type="radio"]) {
        display: none !important;
    }

    :global(#ProseMirror .switcher-option input[type="radio"]:checked + .switcher-label) {
        color: #1f2937 !important;
        font-weight: 600 !important;
    }

    :global(#ProseMirror .switcher-option:has(input[type="radio"]:checked)) {
        background: #3b82f6 !important;
        color: white !important;
    }

    :global(.ProseMirror:focus) {
        outline: none !important;
    }

    :global(#ProseMirror .editor:focus) {
        outline: none !important;
    }

    :global(.ProseMirror *:focus) {
        outline: none !important;
    }
</style>
