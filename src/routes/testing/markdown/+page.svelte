<script lang="ts">
	import MarkdownEdit from '$lib/components/markdownEdit.svelte';
    import { Code } from '@lucide/svelte'

let mdText = $state(`# Markdown editor

This is **bold** text and *italic* text.

> You can also use block quotes

## Features
- Undo / Redo functionality
- Keyboard hot keys \`Ctrl-B\` for bold, \`Ctrl-I\` for Italic
- Switch between Markdown and WYSIWYG views
- Isolated CSS styles
- Real-time preview
- Maintains content when switching views`);
</script>

<div class="p-6">
	<h1 class="text-3xl font-bold mb-6">Markdown Editor Test</h1>
	<MarkdownEdit bind:markdown={mdText} />
</div>
