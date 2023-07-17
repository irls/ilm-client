import { secondsToPixels } from 'waveform-playlist/lib/utils/conversions';
import CanvasHook from 'waveform-playlist/lib/render/CanvasHook';
import h from 'virtual-dom/h';

import SelectState from './states/SelectState.js';

const MAX_CANVAS_WIDTH = 1000;

var renderTrack = function(data) {
  const width = this.peaks.length;
    const playbackX = secondsToPixels(
      data.playbackSeconds,
      data.resolution,
      data.sampleRate
    );
    const startX = secondsToPixels(
      this.startTime,
      data.resolution,
      data.sampleRate
    );
    const endX = secondsToPixels(
      this.endTime,
      data.resolution,
      data.sampleRate
    );
    let progressWidth = 0;
    const numChan = this.peaks.data.length;
    const scale = window.devicePixelRatio > 1 ? Math.floor(window.devicePixelRatio) : 1;

    if (playbackX > 0 && playbackX > startX) {
      if (playbackX < endX) {
        progressWidth = playbackX - startX;
      } else {
        progressWidth = width;
      }
    }

    const waveformChildren = [
      h("div.cursor", {
        attributes: {
          style: `position: absolute; width: 1px; margin: 0; padding: 0; top: 0; left: ${playbackX}px; bottom: 0; z-index: 5;`,
        },
      }),
    ];

    const channels = Object.keys(this.peaks.data).map((channelNum) => {
      const channelChildren = [
        h("div.channel-progress", {
          attributes: {
            style: `position: absolute; width: ${progressWidth}px; height: ${data.height}px; z-index: 2;`,
          },
        }),
      ];
      let offset = 0;
      let totalWidth = width;
      const peaks = this.peaks.data[channelNum];

      while (totalWidth > 0) {
        const currentWidth = Math.min(totalWidth, MAX_CANVAS_WIDTH);
        const canvasColor = this.waveOutlineColor
          ? this.waveOutlineColor
          : data.colors.waveOutlineColor;

        channelChildren.push(
          h("canvas", {
            attributes: {
              width: currentWidth * scale,
              height: data.height * scale,
              style: `float: left; position: relative; margin: 0; padding: 0; z-index: 3; width: ${currentWidth}px; height: ${data.height}px;`,
            },
            hook: new CanvasHook(
              peaks,
              offset,
              this.peaks.bits,
              canvasColor,
              scale,
              data.height
            ),
          })
        );

        totalWidth -= currentWidth;
        offset += MAX_CANVAS_WIDTH;
      }

      // if there are fades, display them.
      if (this.fadeIn) {
        const fadeIn = this.fades[this.fadeIn];
        const fadeWidth = secondsToPixels(
          fadeIn.end - fadeIn.start,
          data.resolution,
          data.sampleRate
        );

        channelChildren.push(
          h(
            "div.wp-fade.wp-fadein",
            {
              attributes: {
                style: `position: absolute; height: ${data.height}px; width: ${fadeWidth}px; top: 0; left: 0; z-index: 4;`,
              },
            },
            [
              h("canvas", {
                attributes: {
                  width: fadeWidth,
                  height: data.height,
                },
                hook: new FadeCanvasHook(
                  fadeIn.type,
                  fadeIn.shape,
                  fadeIn.end - fadeIn.start,
                  data.resolution
                ),
              }),
            ]
          )
        );
      }

      if (this.fadeOut) {
        const fadeOut = this.fades[this.fadeOut];
        const fadeWidth = secondsToPixels(
          fadeOut.end - fadeOut.start,
          data.resolution,
          data.sampleRate
        );

        channelChildren.push(
          h(
            "div.wp-fade.wp-fadeout",
            {
              attributes: {
                style: `position: absolute; height: ${data.height}px; width: ${fadeWidth}px; top: 0; right: 0; z-index: 4;`,
              },
            },
            [
              h("canvas", {
                attributes: {
                  width: fadeWidth,
                  height: data.height,
                },
                hook: new FadeCanvasHook(
                  fadeOut.type,
                  fadeOut.shape,
                  fadeOut.end - fadeOut.start,
                  data.resolution
                ),
              }),
            ]
          )
        );
      }

      return h(
        `div.channel.channel-${channelNum}`,
        {
          attributes: {
            style: `height: ${data.height}px; width: ${width}px; top: ${
              channelNum * data.height
            }px; left: ${startX}px; position: absolute; margin: 0; padding: 0; z-index: 1;`,
          },
        },
        channelChildren
      );
    });

    waveformChildren.push(channels);
    waveformChildren.push(this.renderOverlay(data));

    // draw cursor selection on active track.
    if (data.isActive === true) {
      const cStartX = secondsToPixels(
        data.timeSelection.start,
        data.resolution,
        data.sampleRate
      );
      const cEndX = secondsToPixels(
        data.timeSelection.end,
        data.resolution,
        data.sampleRate
      );
      const cWidth = cEndX - cStartX + 1;
      const cClassName = cWidth > 1 ? ".segment" : ".point";

      waveformChildren.push(
        h(`div.selection${cClassName}`, {
          attributes: {
            style: `position: absolute; width: ${cWidth}px; bottom: 0; top: 0; left: ${cStartX}px; z-index: 4;`,
          },
        })
      );
    }

    const waveform = h(
      "div.waveform",
      {
        attributes: {
          style: `height: ${numChan * data.height}px; position: relative;`,
        },
      },
      waveformChildren
    );

    const channelChildren = [];
    let channelMargin = 0;

    if (data.controls.show) {
      channelChildren.push(this.renderControls(data));
      channelMargin = data.controls.width;
    }

    channelChildren.push(waveform);

    const audibleClass = data.shouldPlay ? "" : ".silent";
    const customClass =
      this.customClass === undefined ? "" : `.${this.customClass}`;

    return h(
      `div.channel-wrapper${audibleClass}${customClass}`,
      {
        attributes: {
          style: `margin-left: ${channelMargin}px; height: ${
            data.height * numChan
          }px;`,
        },
      },
      channelChildren
    );
};

var setState = function(state) {
  this.state = state;

  if (this.state && this.enabledStates[this.state] && this.state === 'select') {
    this.stateObj = new SelectState(this);
  } else {
    this.stateObj = undefined;
  }
};

module.exports = {
  renderTrack, setState
}