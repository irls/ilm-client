<script>
  import { onMount, tick } from 'svelte';

  // props
  export let items;
  export let height = '100%';
  export let itemHeight = undefined;

  // read-only, but visible to consumers via bind:start
  export let start = 0;
  export let end = 0;
  export let scrollTo = false;
  export let scrollToProxy = false;

  // local state
  let height_map = [];
  let rows;
  let viewport;
  let contents;
  let viewport_height = 0;
  let visible;
  let mounted;

  let top = 0;
  let bottom = 0;
  let average_height;

  $: visible = items.slice(start, end).map((data, i) => {
    //console.log('visible', start, end);
    //console.log('visible', `height_map[${start}]`, height_map[start], `height_map[${end}]`, height_map[end]);
    return { index: i + start, data };
  });

  // whenever `items` changes, invalidate the current heightmap
  $: if (mounted) refresh(items, viewport_height, itemHeight);

  async function refresh(items, viewport_height, itemHeight) {

    const { scrollTop } = viewport;

    await tick(); // wait until the DOM is up to date

    let content_height = top - scrollTop;
    let i = start;

    //console.log('refresh start', start);

    while (content_height < viewport_height && i < items.length) {
      let row = rows[i - start];

      if (!row) {
        end = i + 1;
        await tick(); // render the newly visible row
        row = rows[i - start];
      }

      const row_height = height_map[i] = itemHeight || row.offsetHeight;
      content_height += row_height;
      i += 1;
    }

    end = i;

    const remaining = items.length - end;
    average_height = (top + content_height) / end;

    bottom = remaining * average_height;
    height_map.length = items.length;

    //console.log('refresh items.length, viewport_height, average_height', items.length, viewport_height, average_height);

  }

  $: handle_scrollTo(scrollTo);

  async function handle_scrollTo(scrollTo) {

    //console.log('handle_scrollTo', mounted, scrollTo, start, average_height)
    if (!scrollTo) return;

    //await tick();
    //await tick();

    let expected_height = 0;
    const old_start = scrollTo;

    console.log('handle_scrollTo');

    for (let i = 0; i < scrollTo; i +=1) {
      expected_height += height_map[i] || average_height || 0;
      //console.log(`height_map ${i}:`, height_map[i], average_height);
    }

    console.log('handle_scrollTo expected_height', expected_height);
    //console.log('scrollTop', scrollTop);
    await asyncScrollTo(expected_height, old_start);

    //await refresh_s(old_start);

    //await tick();
    console.log('handle_scrollTo scrollTo, start', scrollTo, start);

    /*if (scrollTo == start)*/
    //if (!isNaN(average_height))
    //await refresh(items, viewport_height, itemHeight);
    //scrollTo = false;
    //await tick();
    //handle_scroll_s();
//     refresh(items, viewport_height, itemHeight);
    //await tick();

    //await handle_scroll();
//     await refresh_s(old_start);
//     console.log('tick12');
//     for (let i = 0; i < scrollTo; i +=1) {
//       expected_height += height_map[i] || average_height || 0;
//       //console.log(`height_map ${i}:`, height_map[i], average_height);
//     }
//
//     console.log('handle_scrollTo expected_height', expected_height);
  }

  async function asyncScrollTo(expected_height, old_start) {
    await tick();
    viewport.scrollTo(0, expected_height);
    //start = old_start;
  }

  async function handle_scroll() {
    const { scrollTop } = viewport;
    //console.log('handle_scroll', scrollTop);
    const old_start = start;

    for (let v = 0; v < rows.length; v += 1) {
      height_map[start + v] = itemHeight || rows[v].offsetHeight;
    }

    let i = 0;
    let y = 0;

    while (i < items.length) {
      //if (height_map[i]) console.log('handle_scroll', `height_map[${i}]`, height_map[i]);
      const row_height = height_map[i] || average_height;
      if (y + row_height > scrollTop) {
        start = i;
        top = y;

        break;
      }

      y += row_height;
      i += 1;
    }

    while (i < items.length) {
      y += height_map[i] || average_height;
      i += 1;

      if (y > scrollTop + viewport_height) break;
    }

    end = i;

    const remaining = items.length - end;
    average_height = y / end;

    while (i < items.length) height_map[i++] = average_height;
    bottom = remaining * average_height;

    // prevent jumping if we scrolled up into unknown territory
    //console.log('handle_scroll', old_start, start);
    if (start < old_start) {
      await tick();

      let expected_height = 0;
      let actual_height = 0;

      for (let i = start; i < old_start; i +=1) {
        if (rows[i - start]) {
          expected_height += height_map[i] || average_height;
          actual_height += itemHeight || rows[i - start].offsetHeight;
        }
      }

      //console.log('handle_scroll', 'actual_height', actual_height, 'expected_height', expected_height);
      const d = actual_height - expected_height;
      viewport.scrollTo(0, scrollTop + d);
    }

    // TODO if we overestimated the space these
    // rows would occupy we may need to add some
    // more. maybe we can just call handle_scroll again?
  }

  // trigger initial refresh
  onMount(async () => {
    rows = contents.getElementsByTagName('svelte-virtual-list-row');
    console.log('onMount scrollTo', scrollTo);
    if (scrollToProxy) {
      await refresh(items, viewport_height, itemHeight);
      //viewport.scrollTo(0, 10);
      await handle_scroll();
      //viewport.scrollTo(0, 20);
      //await tick();
      scrollTo = scrollToProxy;
      //setTimeout(() => {scrollTo = scrollToProxy}, 10);

    } else {
      mounted = true;
    }
  });
</script>

<style>
  svelte-virtual-list-viewport {
    position: relative;
    overflow-y: auto;
    -webkit-overflow-scrolling:touch;
    display: block;
  }

  svelte-virtual-list-contents, svelte-virtual-list-row {
    display: block;
  }

  svelte-virtual-list-row {
    overflow-y: hidden;
  }
</style>

<svelte-virtual-list-viewport
  bind:this={viewport}
  bind:offsetHeight={viewport_height}
  on:scroll={handle_scroll}
  style="height: {height};"
>
  <svelte-virtual-list-contents
    bind:this={contents}
    style="padding-top: {top}px; padding-bottom: {bottom}px;"
  >
    {#each visible as row (row.index)}
      <svelte-virtual-list-row>
        <slot item={row.data}>Missing template</slot>
      </svelte-virtual-list-row>
    {/each}
  </svelte-virtual-list-contents>
</svelte-virtual-list-viewport>
