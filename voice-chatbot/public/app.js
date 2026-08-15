const speechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition

const translations = {
  'ja-JP': {
    pageTitle: '店舗マニュアル回答ボット',
    heroTitle: '店舗マニュアル回答ボット',
    heroLead: '音声入力で店舗マニュアルを検索し、回答します。',
    speechStatusLabel: '音声',
    serverStatusLabel: 'Dify',
    languageSelectorLabel: '音声認識言語',
    readyMessage: '準備完了です。ボタンを押している間だけ話してください。離すと自動送信します。',
    unsupportedBrowser: 'このブラウザは Web Speech API に対応していません。Chrome 系ブラウザを推奨します。',
    speechUnsupported: '非対応ブラウザ',
    speechIdle: '待機中',
    speechListening: '録音中',
    speechStopped: '停止',
    speechError: 'エラー',
    noTranscript: '音声を認識できませんでした',
    loadingAnswer: '考え中...',
    loadingError: '応答を取得できませんでした。',
    sendFailure: '送信に失敗しました',
    streamError: 'Dify stream error.',
    genericApiError: 'Dify API request failed.',
    healthError: 'サーバー状態を確認できません',
    envMissing: '.env に DIFY_BASE_URL と DIFY_API_KEY を設定してください。',
    serverReady: '設定済み',
    serverMissing: '未設定',
    serverChecking: '確認中',
    serverError: 'エラー',
    generating: 'Dify が応答を生成中です',
    loadingInline: 'Loading...',
    holdToTalk: '押して話す',
    releaseToSend: '離して送信',
    sending: '送信中...',
    holdAria: '押している間だけ録音',
    stopAria: '録音停止',
    idlePrompt: 'ボタンを押している間だけ録音します',
    recordingPrompt: '話してください',
    roleUser: 'あなた',
    roleAssistant: 'Dify',
    roleSystem: 'システム',
  },
  'zh-CN': {
    pageTitle: '门店手册回答机器人',
    heroTitle: '门店手册回答机器人',
    heroLead: '通过语音输入搜索门店手册并返回答案。',
    speechStatusLabel: '语音',
    serverStatusLabel: 'Dify',
    languageSelectorLabel: '语音识别语言',
    readyMessage: '已准备就绪。按住按钮说话，松开后会自动发送。',
    unsupportedBrowser: '当前浏览器不支持 Web Speech API。建议使用 Chrome 系浏览器。',
    speechUnsupported: '浏览器不支持',
    speechIdle: '待机中',
    speechListening: '录音中',
    speechStopped: '已停止',
    speechError: '错误',
    noTranscript: '未能识别到语音',
    loadingAnswer: '正在思考...',
    loadingError: '未能获取回复。',
    sendFailure: '发送失败',
    streamError: 'Dify 流式响应错误。',
    genericApiError: 'Dify API 请求失败。',
    healthError: '无法确认服务器状态',
    envMissing: '请在 .env 中设置 DIFY_BASE_URL 和 DIFY_API_KEY。',
    serverReady: '已配置',
    serverMissing: '未配置',
    serverChecking: '检查中',
    serverError: '错误',
    generating: 'Dify 正在生成回复',
    loadingInline: 'Loading...',
    holdToTalk: '按住说话',
    releaseToSend: '松开发送',
    sending: '发送中...',
    holdAria: '按住时录音',
    stopAria: '停止录音',
    idlePrompt: '按住按钮说话，松开后自动发送',
    recordingPrompt: '请开始说话',
    roleUser: '你',
    roleAssistant: 'Dify',
    roleSystem: '系统',
  },
  'en-US': {
    pageTitle: 'Store Manual Answer Bot',
    heroTitle: 'Store Manual Answer Bot',
    heroLead: 'Search the store manual by voice and return an answer.',
    speechStatusLabel: 'Voice',
    serverStatusLabel: 'Dify',
    languageSelectorLabel: 'Speech recognition language',
    readyMessage: 'Ready. Hold the button while speaking. Release to send automatically.',
    unsupportedBrowser: 'This browser does not support the Web Speech API. Chrome-based browsers are recommended.',
    speechUnsupported: 'Unsupported',
    speechIdle: 'Idle',
    speechListening: 'Listening',
    speechStopped: 'Stopped',
    speechError: 'Error',
    noTranscript: 'No speech was recognized',
    loadingAnswer: 'Thinking...',
    loadingError: 'Could not get a response.',
    sendFailure: 'Send failed',
    streamError: 'Dify stream error.',
    genericApiError: 'Dify API request failed.',
    healthError: 'Could not verify server status',
    envMissing: 'Set DIFY_BASE_URL and DIFY_API_KEY in .env.',
    serverReady: 'Configured',
    serverMissing: 'Missing',
    serverChecking: 'Checking',
    serverError: 'Error',
    generating: 'Dify is generating a response',
    loadingInline: 'Loading...',
    holdToTalk: 'Hold to talk',
    releaseToSend: 'Release to send',
    sending: 'Sending...',
    holdAria: 'Hold to record',
    stopAria: 'Stop recording',
    idlePrompt: 'Hold to talk. Release to send.',
    recordingPrompt: 'Start speaking',
    roleUser: 'You',
    roleAssistant: 'Dify',
    roleSystem: 'System',
  },
  'ko-KR': {
    pageTitle: '매장 매뉴얼 답변 봇',
    heroTitle: '매장 매뉴얼 답변 봇',
    heroLead: '음성 입력으로 매장 매뉴얼을 검색하고 답변합니다.',
    speechStatusLabel: '음성',
    serverStatusLabel: 'Dify',
    languageSelectorLabel: '음성 인식 언어',
    readyMessage: '준비되었습니다. 버튼을 누른 상태로 말하고, 놓으면 자동으로 전송됩니다.',
    unsupportedBrowser: '이 브라우저는 Web Speech API를 지원하지 않습니다. Chrome 계열 브라우저를 권장합니다.',
    speechUnsupported: '지원 안 됨',
    speechIdle: '대기 중',
    speechListening: '녹음 중',
    speechStopped: '정지',
    speechError: '오류',
    noTranscript: '음성을 인식하지 못했습니다',
    loadingAnswer: '생성 중...',
    loadingError: '응답을 가져오지 못했습니다.',
    sendFailure: '전송 실패',
    streamError: 'Dify 스트림 오류입니다.',
    genericApiError: 'Dify API 요청에 실패했습니다.',
    healthError: '서버 상태를 확인할 수 없습니다',
    envMissing: '.env에 DIFY_BASE_URL 과 DIFY_API_KEY를 설정하세요.',
    serverReady: '설정됨',
    serverMissing: '미설정',
    serverChecking: '확인 중',
    serverError: '오류',
    generating: 'Dify가 응답을 생성 중입니다',
    loadingInline: 'Loading...',
    holdToTalk: '눌러서 말하기',
    releaseToSend: '놓아서 전송',
    sending: '전송 중...',
    holdAria: '누르고 있는 동안 녹음',
    stopAria: '녹음 중지',
    idlePrompt: '버튼을 누른 상태로 말하고, 놓으면 자동 전송됩니다',
    recordingPrompt: '말씀해 주세요',
    roleUser: '사용자',
    roleAssistant: 'Dify',
    roleSystem: '시스템',
  },
  'vi-VN': {
    pageTitle: 'Bot trả lời sổ tay cửa hàng',
    heroTitle: 'Bot trả lời sổ tay cửa hàng',
    heroLead: 'Tìm kiếm sổ tay cửa hàng bằng giọng nói và trả lời.',
    speechStatusLabel: 'Giọng nói',
    serverStatusLabel: 'Dify',
    languageSelectorLabel: 'Ngôn ngữ nhận diện giọng nói',
    readyMessage: 'Đã sẵn sàng. Giữ nút khi nói và thả ra để gửi tự động.',
    unsupportedBrowser: 'Trình duyệt này không hỗ trợ Web Speech API. Nên dùng trình duyệt nền Chrome.',
    speechUnsupported: 'Không hỗ trợ',
    speechIdle: 'Chờ',
    speechListening: 'Đang ghi âm',
    speechStopped: 'Đã dừng',
    speechError: 'Lỗi',
    noTranscript: 'Không nhận diện được giọng nói',
    loadingAnswer: 'Đang suy nghĩ...',
    loadingError: 'Không lấy được phản hồi.',
    sendFailure: 'Gửi thất bại',
    streamError: 'Lỗi luồng Dify.',
    genericApiError: 'Yêu cầu Dify API thất bại.',
    healthError: 'Không thể kiểm tra trạng thái máy chủ',
    envMissing: 'Hãy cấu hình DIFY_BASE_URL và DIFY_API_KEY trong .env.',
    serverReady: 'Đã cấu hình',
    serverMissing: 'Chưa cấu hình',
    serverChecking: 'Đang kiểm tra',
    serverError: 'Lỗi',
    generating: 'Dify đang tạo phản hồi',
    loadingInline: 'Loading...',
    holdToTalk: 'Giữ để nói',
    releaseToSend: 'Thả để gửi',
    sending: 'Đang gửi...',
    holdAria: 'Giữ để ghi âm',
    stopAria: 'Dừng ghi âm',
    idlePrompt: 'Nhấn giữ để nói, thả ra để gửi tự động',
    recordingPrompt: 'Hãy bắt đầu nói',
    roleUser: 'Bạn',
    roleAssistant: 'Dify',
    roleSystem: 'Hệ thống',
  },
}

const state = {
  recognition: null,
  isListening: false,
  isSending: false,
  shouldSubmitAfterStop: false,
  speechStatusKey: 'speechIdle',
  serverStatusKey: 'serverChecking',
  finalTranscript: '',
  interimTranscript: '',
  conversationId: '',
  userId: loadStoredValue('voice-chatbot-user-id', 'voice-chatbot-user'),
  language: loadStoredValue('voice-chatbot-language', 'ja-JP'),
}

const elements = {
  pageTitle: document.querySelector('#pageTitle'),
  heroTitle: document.querySelector('#heroTitle'),
  heroLead: document.querySelector('#heroLead'),
  languageSelector: document.querySelector('#languageSelector'),
  languageChips: Array.from(document.querySelectorAll('.language-chip')),
  voiceHoldButton: document.querySelector('#voiceHoldButton'),
  voiceHoldLabel: document.querySelector('#voiceHoldLabel'),
  chatForm: document.querySelector('#chatForm'),
  interimTranscript: document.querySelector('#interimTranscript'),
  messages: document.querySelector('#messages'),
  messageTemplate: document.querySelector('#messageTemplate'),
}

bootstrap().catch((error) => {
  appendMessage('system', resolveLocalizedMessage('initError', error instanceof Error ? error.message : 'unknown error'), { i18nKey: 'initError', detail: error instanceof Error ? error.message : 'unknown error' })
})

async function bootstrap() {
  bindEvents()
  initRecognition()
  applyLocale()
  syncLanguageChips()
  syncTranscriptStatus()
  await checkServerHealth()
  appendMessage('system', t('readyMessage'), { i18nKey: 'readyMessage' })
}

function bindEvents() {
  elements.chatForm.addEventListener('submit', event => event.preventDefault())
  elements.languageChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      if (state.isListening || state.isSending)
        return
      state.language = chip.dataset.language || 'ja-JP'
      localStorage.setItem('voice-chatbot-language', state.language)
      applyLocale()
      syncLanguageChips()
      syncTranscriptStatus()
    })
  })
  elements.voiceHoldButton.addEventListener('pointerdown', handleHoldStart)
  elements.voiceHoldButton.addEventListener('pointerup', handleHoldEnd)
  elements.voiceHoldButton.addEventListener('pointercancel', handleHoldEnd)
  elements.voiceHoldButton.addEventListener('pointerleave', (event) => {
    if (state.isListening && event.buttons === 0)
      handleHoldEnd()
  })
  elements.voiceHoldButton.addEventListener('contextmenu', (event) => {
    event.preventDefault()
  })
}

function initRecognition() {
  if (!speechRecognitionCtor) {
    state.speechStatusKey = 'speechUnsupported'
    elements.voiceHoldButton.disabled = true
    appendMessage('system', t('unsupportedBrowser'), { i18nKey: 'unsupportedBrowser' })
    return
  }

  const recognition = new speechRecognitionCtor()
  recognition.lang = state.language
  recognition.continuous = true
  recognition.interimResults = true

  recognition.onstart = () => {
    state.isListening = true
    state.speechStatusKey = 'speechListening'
    updateHoldButtonState()
  }

  recognition.onresult = (event) => {
    let finalTranscript = state.finalTranscript
    let interimTranscript = ''

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal)
        finalTranscript += transcript
      else
        interimTranscript += transcript
    }

    state.finalTranscript = finalTranscript
    state.interimTranscript = interimTranscript
    syncTranscriptStatus()
  }

  recognition.onerror = (event) => {
    state.isListening = false
    state.shouldSubmitAfterStop = false
    appendMessage('system', `${t('speechError')}: ${event.error}`)
    updateHoldButtonState()
  }

  recognition.onend = async () => {
    state.isListening = false
    state.speechStatusKey = 'speechStopped'
    updateHoldButtonState()

    if (!state.shouldSubmitAfterStop)
      return

    state.shouldSubmitAfterStop = false
    const transcript = [state.finalTranscript, state.interimTranscript].filter(Boolean).join('').trim()
    state.finalTranscript = ''
    state.interimTranscript = ''
    syncTranscriptStatus()

    if (!transcript) {
      elements.interimTranscript.textContent = t('noTranscript')
      return
    }

    await submitMessage(transcript)
  }

  state.recognition = recognition
  state.speechStatusKey = 'speechIdle'
  updateHoldButtonState()
}

function handleHoldStart(event) {
  event.preventDefault()
  if (!state.recognition || state.isListening || state.isSending)
    return

  elements.voiceHoldButton.setPointerCapture?.(event.pointerId)
  state.finalTranscript = ''
  state.interimTranscript = ''
  syncTranscriptStatus(getRecordingPrompt())
  state.recognition.lang = state.language
  state.shouldSubmitAfterStop = false
  state.recognition.start()
}

function handleHoldEnd() {
  if (!state.recognition || !state.isListening)
    return

  state.shouldSubmitAfterStop = true
  state.recognition.stop()
}

function syncTranscriptStatus(fallbackText = getIdlePrompt()) {
  const transcript = [state.finalTranscript, state.interimTranscript].filter(Boolean).join('')
  elements.interimTranscript.classList.remove('loading')
  elements.interimTranscript.textContent = transcript || fallbackText
}

function syncLanguageChips() {
  elements.languageChips.forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.language === state.language)
    chip.disabled = state.isListening || state.isSending
  })
}

function updateHoldButtonState() {
  if (state.isListening) {
    elements.voiceHoldButton.setAttribute('aria-label', t('stopAria'))
    elements.voiceHoldButton.classList.add('recording')
    elements.voiceHoldLabel.textContent = t('releaseToSend')
    return
  }

  elements.voiceHoldButton.setAttribute('aria-label', t('holdAria'))
  elements.voiceHoldButton.classList.remove('recording')
  elements.voiceHoldLabel.textContent = state.isSending ? t('sending') : t('holdToTalk')
}

async function submitMessage(message) {
  state.isSending = true
  updateSendingState()
  appendMessage('user', message)
  const loadingMessage = appendMessage('assistant', t('loadingAnswer'), { i18nKey: 'loadingAnswer', loading: true })

  try {
    const response = await fetch('/api/chat-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationId: state.conversationId,
        user: state.userId,
      }),
    })

    if (!response.ok)
      throw new Error(await extractErrorMessage(response))

    await consumeChatStream(response, loadingMessage)
    syncTranscriptStatus()
  }
  catch (error) {
    updateMessageBody(loadingMessage, t('loadingError'))
    appendMessage('system', resolveLocalizedMessage('sendFailure', error instanceof Error ? error.message : 'unknown error'), { i18nKey: 'sendFailure', detail: error instanceof Error ? error.message : 'unknown error' })
  }
  finally {
    state.isSending = false
    updateSendingState()
  }
}

async function consumeChatStream(response, loadingMessage) {
  if (!response.body)
    throw new Error('Streaming response body is not available.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let answer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done)
      break

    buffer += decoder.decode(value, { stream: true })

    while (buffer.includes('\n\n')) {
      const separatorIndex = buffer.indexOf('\n\n')
      const block = buffer.slice(0, separatorIndex)
      buffer = buffer.slice(separatorIndex + 2)
      const event = parseSseEvent(block)
      if (!event)
        continue

      if (event.event === 'delta') {
        answer += event.data.text || ''
        if (event.data.conversationId)
          state.conversationId = event.data.conversationId
        updateMessageBody(loadingMessage, answer || t('loadingAnswer'))
      }

      if (event.event === 'meta' && event.data.conversationId)
        state.conversationId = event.data.conversationId

      if (event.event === 'error')
        throw new Error(event.data.message || t('streamError'))
    }
  }

  if (!answer.trim())
    updateMessageBody(loadingMessage, '(empty response)')
}

function parseSseEvent(block) {
  const lines = block.split('\n')
  const eventLine = lines.find(line => line.startsWith('event:'))
  const dataLine = lines.find(line => line.startsWith('data:'))

  if (!eventLine || !dataLine)
    return null

  const event = eventLine.slice(6).trim()
  const rawData = dataLine.slice(5).trim()

  try {
    return {
      event,
      data: JSON.parse(rawData),
    }
  }
  catch {
    return null
  }
}

async function extractErrorMessage(response) {
  try {
    const payload = await response.json()
    return payload.error || t('genericApiError')
  }
  catch {
    return t('genericApiError')
  }
}

async function checkServerHealth() {
  try {
    const response = await fetch('/api/health')
    const payload = await response.json()
    if (!response.ok)
      throw new Error(payload.error || 'Health check failed.')

    state.serverStatusKey = payload.hasDifyBaseUrl && payload.hasDifyApiKey ? 'serverReady' : 'serverMissing'
    if (!payload.hasDifyBaseUrl || !payload.hasDifyApiKey)
      appendMessage('system', t('envMissing'), { i18nKey: 'envMissing' })
  }
  catch (error) {
    state.serverStatusKey = 'serverError'
    appendMessage('system', resolveLocalizedMessage('healthError', error instanceof Error ? error.message : 'unknown error'), { i18nKey: 'healthError', detail: error instanceof Error ? error.message : 'unknown error' })
  }
}

function appendMessage(role, text, options = {}) {
  const fragment = elements.messageTemplate.content.cloneNode(true)
  const message = fragment.querySelector('.message')
  const roleNode = fragment.querySelector('.message-role')
  const bodyNode = fragment.querySelector('.message-body')

  message.classList.add(role)
  message.dataset.role = role
  if (options.i18nKey)
    message.dataset.i18nKey = options.i18nKey
  if (options.detail)
    message.dataset.i18nDetail = options.detail
  roleNode.textContent = roleLabel(role)
  bodyNode.textContent = text
  bodyNode.classList.toggle('loading', Boolean(options.loading))

  elements.messages.appendChild(fragment)
  elements.messages.scrollTop = elements.messages.scrollHeight
  return bodyNode
}

function updateMessageBody(bodyNode, text) {
  if (!bodyNode)
    return
  bodyNode.classList.remove('loading')
  bodyNode.textContent = text
  const parent = bodyNode.closest('.message')
  if (parent) {
    delete parent.dataset.i18nKey
    delete parent.dataset.i18nDetail
  }
  elements.messages.scrollTop = elements.messages.scrollHeight
}

function updateSendingState() {
  elements.voiceHoldButton.disabled = state.isSending
  syncLanguageChips()
  updateHoldButtonState()
  if (state.isSending)
    elements.interimTranscript.textContent = t('generating')
  else if (!state.isListening)
    syncTranscriptStatus()
}

function roleLabel(role) {
  switch (role) {
    case 'user':
      return t('roleUser')
    case 'assistant':
      return t('roleAssistant')
    default:
      return t('roleSystem')
  }
}

function applyLocale() {
  const dict = translations[state.language] || translations['ja-JP']
  document.documentElement.lang = state.language
  document.title = dict.pageTitle
  elements.pageTitle.textContent = dict.pageTitle
  elements.heroTitle.textContent = dict.heroTitle
  elements.heroLead.textContent = dict.heroLead
  elements.languageSelector.setAttribute('aria-label', dict.languageSelectorLabel)
  updateHoldButtonState()
  rerenderLocalizedMessages()
}

function t(key) {
  return (translations[state.language] || translations['ja-JP'])[key]
}

function resolveLocalizedMessage(key, detail = '') {
  switch (key) {
    case 'sendFailure':
      return `${t('sendFailure')}: ${detail}`
    case 'healthError':
      return `${t('healthError')}: ${detail}`
    case 'initError':
      return `${t('roleSystem')}: ${detail}`
    default:
      return t(key)
  }
}

function rerenderLocalizedMessages() {
  const messages = elements.messages.querySelectorAll('.message')
  messages.forEach((message) => {
    const role = message.dataset.role
    const roleNode = message.querySelector('.message-role')
    if (role && roleNode)
      roleNode.textContent = roleLabel(role)

    const key = message.dataset.i18nKey
    if (!key)
      return

    const bodyNode = message.querySelector('.message-body')
    if (!bodyNode)
      return

    bodyNode.textContent = resolveLocalizedMessage(key, message.dataset.i18nDetail || '')
  })
}

function getIdlePrompt() {
  return t('idlePrompt')
}

function getRecordingPrompt() {
  return t('recordingPrompt')
}

function loadStoredValue(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback
  }
  catch {
    return fallback
  }
}
