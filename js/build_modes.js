'use strict';
/**
 * Build ownership policy. New builds and applied presets are independent,
 * editable snapshots. A proposed recommendation is never persisted unless
 * the user explicitly chooses Apply.
 */
function previewRecommendedBuild() {
  if(!state.class)throw Error('Choose a class before previewing a recommendation');
  const cls=state.class, previous=account(), savedRoute=liveRoute,
    savedKey=liveRouteKey, savedBasis=liveRouteBasis,
    savedSpecs=latestSpecialtyPlan, savedCombat=lastOptimizedCombat;
  const candidate={...previous,buildMode:'recommended',boardMode:'recommended',
    manualMastery:null,manualStigma:null,customStigmas:null,
    customSpecialties:{},recommendedRouteSnapshot:null};
  try {
    state.accounts[cls]=candidate;
    liveRoute=null;liveRouteKey='';liveRouteBasis=null;
    const planned=model(),loadout=[...activeStigmas()],nodes=nodeMap();
    const funded=(group,limit)=>routeSteps(plannedRoute(group),nodes)
      .filter(step=>step.total<=limit).map(step=>step.id);
    const purchased=equippedSkillLevelBonuses(),specialties={};
    for(const name of Object.keys(SPECS[cls]||{})){
      const eff=Math.min(40,(planned.mastery.levels[name]||1)+
        (planned.effects.skills[name]||0)+(purchased[name]||0));
      if(eff>=8)specialties[name]=[...recommendedSpecPicks(name,eff)];
    }
    return {
      mastery:{...planned.mastery.levels},
      stigma:{...planned.stigma.levels},
      stigmas:loadout,
      customNodes:funded('crystals',budget('crystals')),
      customAzphelNodes:funded('azphel',candidate.azphel||0),
      customArielNodes:funded('ariel',candidate.ariel||0),
      specialties,planned
    };
  } finally {
    state.accounts[cls]=previous;
    liveRoute=savedRoute;liveRouteKey=savedKey;liveRouteBasis=savedBasis;
    latestSpecialtyPlan=savedSpecs;lastOptimizedCombat=savedCombat;
    // The legacy optimizer saves its route during projection. Restore the
    // user's real account from this transaction even after an exception.
    save();
  }
}
function applyRecommendedBuild() {
  const proposed=previewRecommendedBuild(),a=account();
  a.buildMode='custom';a.boardMode='custom';
  a.manualMastery=proposed.mastery;
  a.manualStigma=proposed.stigma;
  a.customStigmas=proposed.stigmas;
  a.customSpecialties=proposed.specialties;
  a.customNodes=proposed.customNodes;
  a.customAzphelNodes=proposed.customAzphelNodes;
  a.customArielNodes=proposed.customArielNodes;
  a.recommendedRouteSnapshot=null;
  lastBoardRecalculation=null;
  boardRecalculationNotice='';
  boardEditNotice='Recommended build applied as an editable custom copy.';
  save();
  return proposed;
}
function beginBlankBuild() {
  const a=account();
  a.buildMode='custom';a.boardMode='custom';
  a.manualMastery={};a.manualStigma={};
  a.customStigmas=[null,null,null,null];
  a.customSpecialties={};a.customMacros={};
  a.customNodes=[];a.customAzphelNodes=[];a.customArielNodes=[];
  a.recommendedRouteSnapshot=null;
  // New blank means no recorded investments or gear. Resource budgets,
  // level, class and scenario remain, so players can start allocating.
  a.obtainedNodes=[];a.currentRanks={};a.gear={};a.equipment={};
  liveRoute=null;liveRouteKey='';liveRouteBasis=null;
  lastBoardRecalculation=null;boardRecalculationNotice='';
  boardEditNotice='Blank custom build created. All points are available.';
  save();
}
