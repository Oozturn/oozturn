import { getTournament } from "../persistence/tournaments.server";
import { TournamentType } from "../types/tournaments";
import { Duel } from "./tournament/duel"
import { FFA } from "./tournament/ffa"
import { StateElt } from "./tournament/tournament"


export enum TournamentStage {
	Group = "group",
	Final = "final"
}

export interface Stage {
	stageType: TournamentStage
	stage: Duel | FFA
}

export interface TournamentManagerOptions {
	limit?: number;
	advancers?: number[];
	sizes?: number[];
	short?: boolean,
	last?: number,
	lowerScoreIsBetter?: boolean
}

export interface ManagerStates {
	stage: TournamentStage
	state: StateElt
}

interface tournamentManagerInterface {
	tournamentId: string
}

export class TournamentManager implements tournamentManagerInterface {

	private stages: Stage[] = []
	public tournamentId: string;

	constructor(tournamentId: string) {
		const tournament = getTournament(tournamentId)
		this.tournamentId = tournamentId

		const opponentsLength = tournament.settings.useTeams ? tournament.teams?.length || 0 : tournament.players.length

		if (!tournament.managerStates) tournament.managerStates = []
		if (tournament.settings.type == TournamentType.Duel)
			this.stages.push({
				stageType: TournamentStage.Final,
				stage: Duel.restore(opponentsLength, tournament.settings, tournament.managerStates.map(ms => ms.state))
			})
		else
			this.stages.push({
				stageType: TournamentStage.Final,
				stage: FFA.restore(opponentsLength, tournament.settings, tournament.managerStates.map(ms => ms.state))
			})
	}
}