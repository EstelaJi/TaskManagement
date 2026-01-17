<template>
  <div id="app" class="min-h-screen bg-zinc-950 text-zinc-100 flex">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <main class="flex-1 overflow-auto">
      <header class="bg-zinc-900/50 border-b border-zinc-800 px-6 py-4">
        <Header />
      </header>
      <router-view />
    </main>
  </div>
</template>

<script>
import Sidebar from './sidebar/Sidebar.vue'
import Header from './views/Header.vue'
export default {
  name: 'App',
  components: {
    Sidebar,
    Header
  }
}
</script>
