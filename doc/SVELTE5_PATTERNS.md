# Svelte 5 Patterns Reference

## Key Changes from Svelte 4 to 5

### Props
```svelte
<!-- Svelte 4 -->
<script>
  export let name;
  export let age = 25;
</script>

<!-- Svelte 5 -->
<script>
  let { name, age = 25 } = $props();
</script>
```

### State
```svelte
<!-- Svelte 4 -->
<script>
  let count = 0;
</script>

<!-- Svelte 5 -->
<script>
  let count = $state(0);
</script>
```

### Derived Values
```svelte
<!-- Svelte 4 -->
<script>
  $: doubled = count * 2;
</script>

<!-- Svelte 5 -->
<script>
  let doubled = $derived(count * 2);
</script>
```

### Bindable Props
```svelte
<!-- Svelte 4 -->
<script>
  export let value;
</script>

<!-- Svelte 5 -->
<script>
  let { value = $bindable() } = $props();
</script>
```

### Children/Slots
```svelte
<!-- Svelte 4 -->
<slot></slot>

<!-- Svelte 5 -->
<script>
  let { children } = $props();
</script>
{@render children?.()}
```

### Event Handlers
```svelte
<!-- Svelte 4 -->
<button on:click={handleClick}>Click</button>

<!-- Svelte 5 -->
<button onclick={handleClick}>Click</button>
```

### Snippets (New in Svelte 5)
```svelte
{#snippet mySnippet(name)}
  <p>Hello {name}!</p>
{/snippet}

{@render mySnippet('World')}
```

## Component Structure Pattern
```svelte
<script lang="ts">
  // Props
  let { 
    className,
    variant = 'default',
    children,
    onclick,
    ...restProps 
  } = $props();
  
  // State
  let isActive = $state(false);
  
  // Derived
  let computedClass = $derived(`base-class ${variant} ${className || ''}`);
  
  // Functions
  function handleClick(e) {
    isActive = !isActive;
    onclick?.(e);
  }
</script>

<button 
  class={computedClass}
  onclick={handleClick}
  {...restProps}
>
  {@render children?.()}
</button>
```

## Migration Notes
- Replace `export let` with `let { } = $props()`
- Replace reactive statements `$:` with `$derived()`
- Replace `let` for reactive state with `$state()`
- Replace `on:event` with `onevent`
- Replace `<slot>` with `{@render children?.()}`
- Use `$bindable()` for two-way binding
- Use snippets for reusable template logic