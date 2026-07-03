<script>
   import '../app.css'
   import { Toaster } from 'svelte-french-toast'
</script>

<Toaster
   position="bottom-right"
   toastOptions={{
      style: 'background: var(--background-elevated-highlight); color: var(--text-base); border: 1px solid var(--gainsboro); box-shadow: 0 10px 30px var(--shadow-color);',
      iconTheme: { primary: 'var(--essential-announcement)', secondary: 'var(--background-elevated-highlight)' }
   }}
/>

<div class="app">
   <div>
      <slot />
   </div>
</div>
