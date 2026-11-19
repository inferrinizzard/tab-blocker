const BLOCK_RULE_ID = 1;

const IS_ACTIVE_SESSION_STORAGE_KEY = 'tab-blocker-active';

const IS_USER_ORIGINATED_SESSION_STORAGE_KEY = 'tab-blocker-is-user-originated';

export async function getIsExtensionActive() {
  return chrome.storage.session
    .get([IS_ACTIVE_SESSION_STORAGE_KEY])
    .then((res) => res[IS_ACTIVE_SESSION_STORAGE_KEY]);
}
export async function setIsExtensionActive(isActive) {
  return chrome.storage.session.set({
    [IS_ACTIVE_SESSION_STORAGE_KEY]: isActive,
  });
}

export async function getIsUserOriginated() {
  return chrome.storage.session
    .get([IS_USER_ORIGINATED_SESSION_STORAGE_KEY])
    .then((res) => res[IS_USER_ORIGINATED_SESSION_STORAGE_KEY]);
}
export async function setIsUserOriginated(isUserOriginated) {
  return chrome.storage.session.set({
    [IS_USER_ORIGINATED_SESSION_STORAGE_KEY]: isUserOriginated,
  });
}

// blocks all tabs aside from currently open tabs
export async function enableNetBlocking() {
  const knownTabs = await chrome.tabs
    .query({})
    .then((tabs) => tabs.map((tab) => tab.id));
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [BLOCK_RULE_ID],
    addRules: [
      {
        id: BLOCK_RULE_ID,
        priority: 1,
        action: { type: 'block' },
        condition: {
          urlFilter: '*',
          resourceTypes: ['main_frame'],
          excludedTabIds: knownTabs,
        },
      },
    ],
  });
  console.log(
    `Net blocking has been enabled, with ${knownTabs.length} tabs allowed.`,
  );
}
export async function disableNetBlocking() {
  await chrome.declarativeNetRequest.getSessionRules((rules) => {
    const allIds = rules.map((rule) => rule.id);
    chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: allIds,
    });
  });
  console.log(`Net blocking has been disabled.`);
}
export async function allowSite(tabId) {
  const rules = await chrome.declarativeNetRequest.getSessionRules();
  const blockRule = rules.find((rule) => rule.id === BLOCK_RULE_ID);

  if (!blockRule) {
    throw new Error('Cannot approve tab because the blocking rule is missing.');
  }

  const excludedTabIds = blockRule.condition.excludedTabIds ?? [];
  if (excludedTabIds.includes(tabId)) {
    return;
  }

  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [BLOCK_RULE_ID],
    addRules: [
      {
        ...blockRule,
        condition: {
          ...blockRule.condition,
          excludedTabIds: [...excludedTabIds, tabId],
        },
      },
    ],
  });
}
