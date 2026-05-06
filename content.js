const middleClickHandler = function (e) {
  if (e.button !== 1) {
    return;
  }
  chrome.runtime.sendMessage({ isUserOriginated: true });
};

chrome.runtime.onMessage.addListener(function (message, _, sendResponse) {
  console.log({ message });
  if (message.isExtensionActive) {
    document.addEventListener('auxclick', middleClickHandler);
    document.addEventListener('click', middleClickHandler);
    sendResponse({ log: 'Click handler attached' });
  } else {
    document.removeEventListener('auxclick', middleClickHandler);
    document.removeEventListener('click', middleClickHandler);
    sendResponse({ log: 'Click handler removed' });
  }
  return true;
});
