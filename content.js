const middleClickHandler = function (e) {
  if (e.button !== 1) {
    return;
  }
  chrome.runtime.sendMessage({ isUserOriginated: true });
};

function attachHandler() {
  document.addEventListener('auxclick', middleClickHandler);
  document.addEventListener('click', middleClickHandler);
  console.log('[tab-blocker]: Click handler attached');
}

function removeHandler() {
  document.removeEventListener('auxclick', middleClickHandler);
  document.removeEventListener('click', middleClickHandler);
  console.log('[tab-blocker]: Click handler removed');
}

chrome.runtime.onMessage.addListener(async function (message, sender) {
  if (message.isExtensionActive) {
    attachHandler();
  } else {
    removeHandler();
  }
  return true;
});

chrome.runtime.sendMessage({ setup: true, isUserOriginated: false });
