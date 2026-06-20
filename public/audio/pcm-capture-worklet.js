class PcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    const channel = input && input[0];

    if (channel && channel.length > 0) {
      const frame = new Float32Array(channel.length);
      frame.set(channel);
      this.port.postMessage(frame.buffer, [frame.buffer]);
    }

    return true;
  }
}

registerProcessor("pcm-capture-processor", PcmCaptureProcessor);
