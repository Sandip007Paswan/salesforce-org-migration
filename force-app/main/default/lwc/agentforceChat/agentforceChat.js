// agentforceChat.js
import { LightningElement, track } from 'lwc';
import startSession from '@salesforce/apex/AgentforceChatService.startSession';
import sendMessageApex from '@salesforce/apex/AgentforceChatService.sendMessage';
import getAccessToken from '@salesforce/apex/AgentforceChatService.getAccessToken';
import getUserPhone from '@salesforce/apex/AgentforceChatService.getUserPhone';

export default class AgentforceChat extends LightningElement {
    @track chatOpen = false;
    @track messages = [];
    @track userInput = '';
    @track isListening = false;
    @track micManuallyToggled = false;
    @track isSpeaking = false;
    @track awaitingUserInput = true;
    @track isLoading = false;
    @track isTtsEnabled = true;

    @track showConfig = false;
    @track isConversationEnabled = true;
    @track autoMicEnabled = true;
    @track disableDependent = false;
    @track isInitializing = false;


    sessionId;
    accessToken;
    recognition;
    sessionInitialized = false;
    pendingRedirect = null;
    micAutoEnabledOnce = false;
    userPhone = '';

    connectedCallback() {
        this.initSpeechRecognition();
        this.initAccessToken();
        this.fetchUserPhone();
        this.micAutoEnabledOnce = true;

        const existingSession = window.localStorage.getItem('agentforceSessionId');
        const storedHistory = JSON.parse(window.localStorage.getItem('agentforceChatHistory') || '{}');

        const config = JSON.parse(localStorage.getItem('agentforceConfig')) || {};
        this.isConversationEnabled = config.conversation ?? false;
        this.isTtsEnabled = config.tts ?? false;
        this.autoMicEnabled = config.autoMic ?? false;
        this.disableDependent = !this.isConversationEnabled;

        if (existingSession) {
            this.sessionId = existingSession;
            this.sessionInitialized = true;

            if (storedHistory.sessionId === existingSession && Array.isArray(storedHistory.messages)) {
                this.messages = storedHistory.messages;
                this.chatOpen = true;
                this.micAutoEnabledOnce = false;
                this.scrollToBottom();
            }
        }

        window.addEventListener('keydown', this.handleKeyPress.bind(this));
    }

    toggleConfig() {
        this.showConfig = !this.showConfig;
    }

    saveConfig() {
        const config = {
            conversation: this.isConversationEnabled,
            tts: this.isTtsEnabled,
            autoMic: this.autoMicEnabled
        };
        localStorage.setItem('agentforceConfig', JSON.stringify(config));
    }

    toggleConversation(event) {
        this.isConversationEnabled = event.target.checked;
        this.disableDependent = !this.isConversationEnabled;
        if (!this.isConversationEnabled) {
            this.isTtsEnabled = false;
            this.autoMicEnabled = false;
            this.stopListening();
        } else {
            this.isTtsEnabled = true;
            this.autoMicEnabled = true;
        }
        this.saveConfig();
    }

    toggleTts(event) {
        this.isTtsEnabled = event.target.checked;
        this.saveConfig();
    }

    toggleAutoMic(event) {
        this.autoMicEnabled = event.target.checked;
        this.saveConfig();
    }



    handleKeyPress(event) {
        if (this.chatOpen && event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    async fetchUserPhone() {
        try {
            this.userPhone = await getUserPhone();
        } catch (error) {
            console.error('Failed to get user phone:', error);
        }
    }

    async initAccessToken() {
        try {
            this.accessToken = await getAccessToken();
        } catch (error) {
            console.error('Error fetching access token:', error);
        }
    }

    initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'en-US';
            this.recognition.interimResults = false;
            this.recognition.continuous = false;

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (!this.awaitingUserInput || this.isSpeaking) return;
                this.userInput = transcript;
                this.stopListening();
                this.sendMessage();
            };

            this.recognition.onend = () => {
                this.isListening = false;
                if (!this.micManuallyToggled && !this.isSpeaking && this.awaitingUserInput) {
                    setTimeout(() => this.startListening(), 500);
                }
            };
        }
    }

    async toggleChat() {
        this.isInitializing = true;
        if (!this.sessionInitialized) {
            try {
                const response = await startSession();
                this.sessionId = response.sessionId;
                this.isInitializing = false;
                this.sessionInitialized = true;
                window.localStorage.setItem('agentforceSessionId', this.sessionId);

                if (response.messages && response.messages.length > 0) {
                    this.handleBotResponse(response.messages[0].message);
                }

                this.awaitingUserInput = true;
                // this.startListening();
                if (this.isConversationEnabled && this.autoMicEnabled) {
                    this.startListening();
                }

            } catch (error) {
                console.error('Failed to start session:', error);
                return;
            }
        }
        this.isInitializing = false;
        this.chatOpen = !this.chatOpen;
    }

    async sendMessage() {
        const message = this.userInput.trim();
        if (!message || !this.sessionId || !this.accessToken) return;

        const fullMessage = `${message}\n\n{System-context:{\n  phone: ${this.userPhone},\n  current-page-url: ${window.location.href}\n}}`;

        this.awaitingUserInput = false;
        this.stopListening();
        this.isLoading = true;

        this.addUserMessage(message); // only show plain user message
        this.userInput = '';

        try {
            const response = await sendMessageApex({
                sessionId: this.sessionId,
                userMessage: fullMessage,
                accessToken: this.accessToken
            });

            if (response.messages && response.messages.length > 0) {
                this.handleBotResponse(response.messages[0].message);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            this.isLoading = false;
        }
    }

    handleBotResponse(text) {
        const urlMatch = text.match(/Taking you to[^\n]*?(https?:\/\/[^\s]+)/i);
        if (urlMatch) {
            this.pendingRedirect = urlMatch[1];
            this.addBotMessage(text);
            this.speak('Taking you to the page');
        } else {
            this.pendingRedirect = null;
            this.addBotMessage(text);
            this.speak(text);
        }
    }

    speak(text) {
        try {
            if (!text) return;

            if (!this.isTtsEnabled) {
                if (this.pendingRedirect) {
                    window.location.href = this.pendingRedirect;
                    this.pendingRedirect = null;
                }
                return;
            }

            this.stopListening();
            this.isSpeaking = true;
            this.awaitingUserInput = false;

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';

            utterance.onend = () => {
                this.isSpeaking = false;

                if (this.pendingRedirect) {
                    window.location.href = this.pendingRedirect;
                    this.pendingRedirect = null;
                    return;
                }

                setTimeout(() => {
                    if (
                        this.isConversationEnabled &&
                        this.autoMicEnabled &&
                        (!this.micManuallyToggled || this.micAutoEnabledOnce)
                    ) {
                        this.awaitingUserInput = true;
                        this.startListening();
                    }
                }, 400);
            };

            speechSynthesis.speak(utterance);
        } catch (err) {
            console.error('Error in TTS:', err);
            this.isSpeaking = false;
            this.awaitingUserInput = true;
        }
    }



    scrollToBottom() {
        setTimeout(() => {
            const chatBody = this.template.querySelector('.chat-body');
            if (chatBody) {
                chatBody.scrollTop = chatBody.scrollHeight;
            }
        }, 100);
    }

    updateChatStorage() {
        const stored = {
            sessionId: this.sessionId,
            messages: this.messages
        };
        window.localStorage.setItem('agentforceChatHistory', JSON.stringify(stored));
    }

    addBotMessage(text) {
        this.messages.push({ id: Date.now(), text, fromUser: false });
        this.updateChatStorage();
        this.scrollToBottom();
    }

    addUserMessage(text) {
        this.messages.push({ id: Date.now(), text, fromUser: true });
        this.updateChatStorage();
        this.scrollToBottom();
    }

    handleInputChange(event) {
        this.userInput = event.target.value;
    }

    get formattedMessages() {
        return this.messages.map(msg => ({
            ...msg,
            cssClass: msg.fromUser ? 'user-message' : 'agent-message'
        }));
    }

    endSession() {
        this.chatOpen = false;
        this.messages = [];
        this.sessionId = null;
        this.sessionInitialized = false;

        this.stopListening();
        this.isSpeaking = false;
        this.awaitingUserInput = false;
        this.micManuallyToggled = false;
        this.micAutoEnabledOnce = false;

        window.localStorage.removeItem('agentforceSessionId');
        window.localStorage.removeItem('agentforceChatHistory');
    }

    startListening() {
        if (this.recognition && !this.isListening && !this.isSpeaking) {
            this.recognition.start();
            this.isListening = true;
            this.scrollToBottom();
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    toggleMic() {
        this.micManuallyToggled = true;
        this.micAutoEnabledOnce = true;
        if (this.isListening) {
            this.stopListening();
        } else if (!this.isSpeaking) {
            this.awaitingUserInput = true;
            this.startListening();
        }
    }

    get micIcon() {
        return this.isListening ? 'utility:record' : 'utility:stop';
    }

    get micTooltip() {
        return this.isListening ? 'Mic is On - Click to stop' : 'Mic is Off - Click to start';
    }

    toggleTts() {
        this.isTtsEnabled = !this.isTtsEnabled;
    }

    get ttsIconName() {
        return this.isTtsEnabled ? 'utility:volume_high' : 'utility:volume_off';
    }

    get chatIconName() {
        return this.chatOpen ? 'utility:chevrondown' : 'utility:chat';
    }
}