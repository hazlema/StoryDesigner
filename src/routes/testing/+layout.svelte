<script lang="ts">
	import '../../app.css';
	
	function goBack() {
		history.go(-1)
	}

	let { children } = $props();
</script>

<div class="w-full bg-card  p-3 border-b border-border">
	<button onclick={() => goBack()}>← Go Back</button>
</div>

{@render children?.()}
