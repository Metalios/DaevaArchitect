// Historical browser tests exercise recommendation calculations explicitly.
// Product defaults remain blank custom builds; do not change that contract.
export async function useLegacyRecommendations(page){
  await page.evaluate(()=>{
    for(const cls of CLASS_ORDER){
      if(state.accounts[cls])continue;
      state.accounts[cls]={...DEFAULT_ACCOUNT(cls),buildMode:'recommended',
        boardMode:'recommended',manualMastery:null,manualStigma:null,
        customStigmas:null};
    }
  });
}
