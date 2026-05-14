import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AudioStreamer } from "./audio-streamer";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ConnectionState = "disconnected" | "connecting" | "connected" | "listening" | "speaking" | "error";

export class LiveClient {
  private ai: GoogleGenAI;
  private session: any = null;
  private audioStreamer: AudioStreamer;
  private state: ConnectionState = "disconnected";
  private onStateChange?: (state: ConnectionState) => void;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.audioStreamer = new AudioStreamer();
  }

  async connect(systemInstruction: string, onStateChange: (state: ConnectionState) => void) {
    this.onStateChange = onStateChange;
    this.updateState("connecting");

    try {
      this.session = await this.ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }, // Witty female voice
          },
          systemInstruction,
          tools: [
            {
              functionDeclarations: [
                {
                  name: "openWebsite",
                  description: "Opens a website for the user.",
                  parameters: {
                    type: "object" as any,
                    properties: {
                      url: { type: "string" as any, description: "The URL of the website to open." },
                    },
                    required: ["url"],
                  },
                },
              ],
            },
          ],
        },
        callbacks: {
          onopen: () => {
            this.updateState("connected");
            this.audioStreamer.startListening(
              (base64) => {
                if (this.session) {
                  this.session.sendRealtimeInput({
                    audio: { data: base64, mimeType: "audio/pcm;rate=16000" },
                  });
                }
              },
              (volume) => {
                if (this.state !== "speaking" && this.state !== "connecting") {
                  if (volume > 0.01) {
                    this.updateState("listening");
                  } else if (this.state === "listening") {
                    this.updateState("connected");
                  }
                }
              }
            );
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              this.updateState("speaking");
              await this.audioStreamer.playAudioChunk(message.serverContent.modelTurn.parts[0].inlineData.data);
            }

            if (message.serverContent?.turnComplete) {
              this.updateState("connected");
            }

            if (message.serverContent?.interrupted) {
              this.audioStreamer.stopAll();
              this.updateState("connected");
              // Restart listening after interruption
              this.audioStreamer.startListening(
                (base64) => {
                  if (this.session) {
                    this.session.sendRealtimeInput({
                      audio: { data: base64, mimeType: "audio/pcm;rate=16000" },
                    });
                  }
                },
                (volume) => {
                  if (this.state !== "speaking" && this.state !== "connecting") {
                    if (volume > 0.01) {
                      this.updateState("listening");
                    } else if (this.state === "listening") {
                      this.updateState("connected");
                    }
                  }
                }
              );
            }


            if (message.toolCall) {
              for (const call of message.toolCall.functionCalls) {
                if (call.name === "openWebsite") {
                  const url = (call.args as any).url;
                  window.open(url, "_blank");
                  this.session.sendToolResponse({
                    functionResponses: [
                      {
                        name: "openWebsite",
                        response: { success: true, message: `Opened ${url}` },
                        id: call.id,
                      },
                    ],
                  });
                }
              }
            }
          },
          onclose: () => {
            this.updateState("disconnected");
            this.audioStreamer.stopAll();
          },
          onerror: (err) => {
            console.error("Live session error:", err);
            this.updateState("error");
            this.audioStreamer.stopAll();
          },
        },
      });
    } catch (err) {
      console.error("Failed to connect to Gemini Live:", err);
      this.updateState("error");
      throw err;
    }
  }

  private updateState(state: ConnectionState) {
    this.state = state;
    this.onStateChange?.(state);
  }

  disconnect() {
    this.session?.close();
    this.audioStreamer.stopAll();
    this.updateState("disconnected");
  }
}
