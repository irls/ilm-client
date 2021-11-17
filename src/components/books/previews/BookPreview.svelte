<script>
  let w;
  let h;
  let size = 42;
  let text = 'edit me';

  export let parlists;

  //$: prepareBlockPreview()

</script>

<input type=range bind:value={size}>
<input bind:value={text}>

<p>size: {w}px x {h}px</p>

<div bind:clientWidth={w} bind:clientHeight={h}>
  <span style="font-size: {size}px">{text}</span>
</div>

{#each parlists.parlistO.listObjs as blockO, bIdx (blockO.blockRid)}
  <p>#{bIdx} {JSON.stringify(blockO)}
  <div class="row content-scroll-item back">
    <div class='col'></div>
  </div>
{/each}

<style>
  input { display: block; }
  div { display: inline-block; }
  span { word-break: break-all; }
</style>
