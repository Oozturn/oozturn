import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { GraphQLContext } from '../../lib/gql/context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  File: File;
};

export type Achievement = {
  __typename?: 'Achievement';
  description: Scalars['String'];
  name: Scalars['String'];
  player: Player;
};

export type BracketOptions = {
  __typename?: 'BracketOptions';
  advancers?: Maybe<Array<Scalars['Int']>>;
  last?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  lowerScoreIsBetter?: Maybe<Scalars['Boolean']>;
  short?: Maybe<Scalars['Boolean']>;
  sizes?: Maybe<Array<Scalars['Int']>>;
};

export type BracketOptionsInput = {
  advancers?: InputMaybe<Array<Scalars['Int']>>;
  last?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
  lowerScoreIsBetter?: InputMaybe<Scalars['Boolean']>;
  short?: InputMaybe<Scalars['Boolean']>;
  sizes?: InputMaybe<Array<Scalars['Int']>>;
};

export type BracketProperties = {
  __typename?: 'BracketProperties';
  options: BracketOptions;
  seeding?: Maybe<Array<BracketSeed>>;
  type: Scalars['String'];
};

export type BracketPropertiesInput = {
  options: BracketOptionsInput;
  seeding?: InputMaybe<Array<BracketSeedInput>>;
  type: Scalars['String'];
};

export type BracketSeed = {
  __typename?: 'BracketSeed';
  nb: Scalars['Int'];
  opponent: Scalars['String'];
};

export type BracketSeedInput = {
  nb: Scalars['Int'];
  opponent: Scalars['String'];
};

export type DateInput = {
  day: Scalars['Int'];
  hour: Scalars['Int'];
  min: Scalars['Int'];
};

export type DateType = {
  __typename?: 'DateType';
  day: Scalars['Int'];
  hour: Scalars['Int'];
  min: Scalars['Int'];
};

export type EditTournamentInput = {
  bracketProperties?: InputMaybe<BracketPropertiesInput>;
  comments?: InputMaybe<Scalars['String']>;
  game?: InputMaybe<Scalars['Int']>;
  globalTournamentSettings?: InputMaybe<GlobalTournamentSettingsInput>;
  id: Scalars['String'];
  name?: InputMaybe<Scalars['String']>;
  startTime?: InputMaybe<DateInput>;
  status?: InputMaybe<TournamentStatus>;
  teamsMaxSize?: InputMaybe<Scalars['Int']>;
  useTeams?: InputMaybe<Scalars['Boolean']>;
  usersCanCreateTeams?: InputMaybe<Scalars['Boolean']>;
};

export type Game = {
  __typename?: 'Game';
  cover: Scalars['String'];
  id: Scalars['Int'];
  name: Scalars['String'];
  picture: Scalars['String'];
  platforms: Array<Maybe<Scalars['Int']>>;
  release?: Maybe<Scalars['Int']>;
};

export type GlobalTournamentSettings = {
  __typename?: 'GlobalTournamentSettings';
  default: Scalars['Int'];
  leaders: Array<Scalars['Int']>;
};

export type GlobalTournamentSettingsInput = {
  default: Scalars['Int'];
  leaders: Array<Scalars['Int']>;
};

export type IdInput = {
  m: Scalars['Int'];
  r: Scalars['Int'];
  s: Scalars['Int'];
};

export type IgdbGame = {
  __typename?: 'IgdbGame';
  cover: Scalars['String'];
  id: Scalars['Int'];
  name: Scalars['String'];
  pictures: Array<Scalars['String']>;
  platforms: Array<Scalars['Int']>;
  release?: Maybe<Scalars['Int']>;
};

export type Lan = {
  __typename?: 'Lan';
  defaultTournamentSettings: GlobalTournamentSettings;
  endDate: DateType;
  motd: Scalars['String'];
  name: Scalars['String'];
  partialResults: Scalars['Boolean'];
  startDate: DateType;
  weightTeamsResults: Scalars['Boolean'];
};

export type LoggedInUser = {
  __typename?: 'LoggedInUser';
  avatar?: Maybe<Scalars['String']>;
  ip?: Maybe<Scalars['String']>;
  isAdmin: Scalars['Boolean'];
  team?: Maybe<Scalars['String']>;
  username: Scalars['String'];
};

export type Match = {
  __typename?: 'Match';
  id: MatchId;
  m?: Maybe<Array<Maybe<Scalars['Int']>>>;
  p: Array<Scalars['Int']>;
};

export type MatchId = {
  __typename?: 'MatchId';
  m: Scalars['Int'];
  r: Scalars['Int'];
  s: Scalars['Int'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addPlayerToTournament?: Maybe<Scalars['String']>;
  addPlayersToTeam?: Maybe<Scalars['String']>;
  adminElevation?: Maybe<LoggedInUser>;
  balanceTournament?: Maybe<Scalars['String']>;
  editTournament?: Maybe<Scalars['String']>;
  forfeitOpponentFromTournament?: Maybe<Scalars['String']>;
  login?: Maybe<LoggedInUser>;
  movePlayer?: Maybe<Scalars['String']>;
  moveTeam?: Maybe<Scalars['String']>;
  newTournamentTeam?: Maybe<Scalars['String']>;
  removeGame?: Maybe<Scalars['String']>;
  removePlayerFromTournament?: Maybe<Scalars['String']>;
  removePlayersFromTeam?: Maybe<Scalars['String']>;
  removeTournament?: Maybe<Scalars['String']>;
  removeTournamentTeam?: Maybe<Scalars['String']>;
  renameTournamentTeam?: Maybe<Scalars['String']>;
  setGame?: Maybe<Scalars['String']>;
  setScore?: Maybe<Scalars['String']>;
  startTournament?: Maybe<Scalars['String']>;
  stopTournament?: Maybe<Scalars['String']>;
  updateLan: Lan;
  updateProfile: LoggedInUser;
  validateTournament?: Maybe<Scalars['String']>;
};


export type MutationAddPlayerToTournamentArgs = {
  player: Scalars['String'];
  tournamentId: Scalars['String'];
};


export type MutationAddPlayersToTeamArgs = {
  players: Array<Scalars['String']>;
  teamName: Scalars['String'];
  tournamentId: Scalars['String'];
};


export type MutationAdminElevationArgs = {
  password: Scalars['String'];
};


export type MutationBalanceTournamentArgs = {
  id: Scalars['String'];
};


export type MutationEditTournamentArgs = {
  input: EditTournamentInput;
};


export type MutationForfeitOpponentFromTournamentArgs = {
  opponent: Scalars['String'];
  tournamentId: Scalars['String'];
};


export type MutationLoginArgs = {
  username: Scalars['String'];
};


export type MutationMovePlayerArgs = {
  newIndex: Scalars['Int'];
  player: Scalars['String'];
  tournamentId: Scalars['String'];
};


export type MutationMoveTeamArgs = {
  newIndex: Scalars['Int'];
  team: Scalars['String'];
  tournamentId: Scalars['String'];
};


export type MutationNewTournamentTeamArgs = {
  teamName: Scalars['String'];
  tournamentId: Scalars['String'];
};


export type MutationRemoveGameArgs = {
  id: Scalars['Int'];
};


export type MutationRemovePlayerFromTournamentArgs = {
  player: Scalars['String'];
  tournamentId: Scalars['String'];
};


export type MutationRemovePlayersFromTeamArgs = {
  players: Array<Scalars['String']>;
  tournamentId: Scalars['String'];
};


export type MutationRemoveTournamentArgs = {
  id: Scalars['String'];
};


export type MutationRemoveTournamentTeamArgs = {
  teamName: Scalars['String'];
  tournamentId: Scalars['String'];
};


export type MutationRenameTournamentTeamArgs = {
  newTeamName: Scalars['String'];
  oldTeamName: Scalars['String'];
  tournamentId: Scalars['String'];
};


export type MutationSetGameArgs = {
  cover: Scalars['String'];
  id: Scalars['Int'];
  name: Scalars['String'];
  picture: Scalars['String'];
  platforms: Array<Scalars['Int']>;
  release?: InputMaybe<Scalars['Int']>;
};


export type MutationSetScoreArgs = {
  matchId: IdInput;
  player: Scalars['Int'];
  score: Scalars['Int'];
  tournamentId: Scalars['String'];
};


export type MutationStartTournamentArgs = {
  id: Scalars['String'];
};


export type MutationStopTournamentArgs = {
  id: Scalars['String'];
};


export type MutationUpdateLanArgs = {
  lan: UpdateLanInput;
};


export type MutationUpdateProfileArgs = {
  avatarFile?: InputMaybe<Scalars['File']>;
  removeAvatar?: InputMaybe<Scalars['Boolean']>;
  team?: InputMaybe<Scalars['String']>;
};


export type MutationValidateTournamentArgs = {
  id: Scalars['String'];
};

export type Player = {
  __typename?: 'Player';
  avatar?: Maybe<Scalars['String']>;
  ips?: Maybe<Array<Scalars['String']>>;
  isAdmin?: Maybe<Scalars['Boolean']>;
  team?: Maybe<Scalars['String']>;
  username: Scalars['String'];
};

export type PlayerResult = {
  __typename?: 'PlayerResult';
  position: Scalars['Int'];
  username: Scalars['String'];
};

export type PlayerStats = {
  __typename?: 'PlayerStats';
  LBwins: Scalars['Int'];
  losses: Scalars['Int'];
  player: Player;
  points: Scalars['Int'];
  secondPlaces: Scalars['Int'];
  tournaments: Scalars['Int'];
  wins: Scalars['Int'];
};

export type Query = {
  __typename?: 'Query';
  achievements: Array<Achievement>;
  games: Array<Game>;
  igdbGames: Array<IgdbGame>;
  lan: Lan;
  leaderboard: Array<PlayerStats>;
  me?: Maybe<LoggedInUser>;
  players: Array<Player>;
  tournament?: Maybe<Tournament>;
  tournaments: Array<TournamentLight>;
};


export type QueryIgdbGamesArgs = {
  idToSearch?: InputMaybe<Scalars['Int']>;
  searchCriteria: Scalars['String'];
};


export type QueryTournamentArgs = {
  id: Scalars['String'];
};

export type TeamsInput = {
  name: Scalars['String'];
  players: Array<Scalars['String']>;
};

export type TeamsTournamentInput = {
  teams: Array<InputMaybe<TeamsInput>>;
  tournamentId: Scalars['String'];
};

export type Tournament = {
  __typename?: 'Tournament';
  bracketProperties: BracketProperties;
  comments: Scalars['String'];
  forfeitOpponents?: Maybe<Array<Scalars['String']>>;
  game: Scalars['Int'];
  globalTournamentSettings: GlobalTournamentSettings;
  id: Scalars['String'];
  matches?: Maybe<Array<Match>>;
  name: Scalars['String'];
  players: Array<Player>;
  results?: Maybe<Array<PlayerResult>>;
  startTime: DateType;
  status: TournamentStatus;
  teams?: Maybe<Array<TournamentTeam>>;
  teamsMaxSize?: Maybe<Scalars['Int']>;
  useTeams: Scalars['Boolean'];
  usersCanCreateTeams?: Maybe<Scalars['Boolean']>;
};

export type TournamentLight = {
  __typename?: 'TournamentLight';
  game: Scalars['Int'];
  id: Scalars['String'];
  name: Scalars['String'];
  players: Array<Scalars['String']>;
  startTime: DateType;
  status: TournamentStatus;
};

export enum TournamentStatus {
  Balancing = 'BALANCING',
  Done = 'DONE',
  Open = 'OPEN',
  Paused = 'PAUSED',
  Running = 'RUNNING',
  Validating = 'VALIDATING'
}

export type TournamentTeam = {
  __typename?: 'TournamentTeam';
  name: Scalars['String'];
  players: Array<Scalars['String']>;
};

export type UpdateLanInput = {
  defaultTournamentSettings?: InputMaybe<GlobalTournamentSettingsInput>;
  endDate?: InputMaybe<DateInput>;
  motd?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  partialResults?: InputMaybe<Scalars['Boolean']>;
  startDate?: InputMaybe<DateInput>;
  weightTeamsResults?: InputMaybe<Scalars['Boolean']>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Achievement: ResolverTypeWrapper<Achievement>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  BracketOptions: ResolverTypeWrapper<BracketOptions>;
  BracketOptionsInput: BracketOptionsInput;
  BracketProperties: ResolverTypeWrapper<BracketProperties>;
  BracketPropertiesInput: BracketPropertiesInput;
  BracketSeed: ResolverTypeWrapper<BracketSeed>;
  BracketSeedInput: BracketSeedInput;
  DateInput: DateInput;
  DateType: ResolverTypeWrapper<DateType>;
  EditTournamentInput: EditTournamentInput;
  File: ResolverTypeWrapper<Scalars['File']>;
  Game: ResolverTypeWrapper<Game>;
  GlobalTournamentSettings: ResolverTypeWrapper<GlobalTournamentSettings>;
  GlobalTournamentSettingsInput: GlobalTournamentSettingsInput;
  IdInput: IdInput;
  IgdbGame: ResolverTypeWrapper<IgdbGame>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Lan: ResolverTypeWrapper<Lan>;
  LoggedInUser: ResolverTypeWrapper<LoggedInUser>;
  Match: ResolverTypeWrapper<Match>;
  MatchId: ResolverTypeWrapper<MatchId>;
  Mutation: ResolverTypeWrapper<{}>;
  Player: ResolverTypeWrapper<Player>;
  PlayerResult: ResolverTypeWrapper<PlayerResult>;
  PlayerStats: ResolverTypeWrapper<PlayerStats>;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']>;
  TeamsInput: TeamsInput;
  TeamsTournamentInput: TeamsTournamentInput;
  Tournament: ResolverTypeWrapper<Tournament>;
  TournamentLight: ResolverTypeWrapper<TournamentLight>;
  TournamentStatus: TournamentStatus;
  TournamentTeam: ResolverTypeWrapper<TournamentTeam>;
  UpdateLanInput: UpdateLanInput;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Achievement: Achievement;
  Boolean: Scalars['Boolean'];
  BracketOptions: BracketOptions;
  BracketOptionsInput: BracketOptionsInput;
  BracketProperties: BracketProperties;
  BracketPropertiesInput: BracketPropertiesInput;
  BracketSeed: BracketSeed;
  BracketSeedInput: BracketSeedInput;
  DateInput: DateInput;
  DateType: DateType;
  EditTournamentInput: EditTournamentInput;
  File: Scalars['File'];
  Game: Game;
  GlobalTournamentSettings: GlobalTournamentSettings;
  GlobalTournamentSettingsInput: GlobalTournamentSettingsInput;
  IdInput: IdInput;
  IgdbGame: IgdbGame;
  Int: Scalars['Int'];
  Lan: Lan;
  LoggedInUser: LoggedInUser;
  Match: Match;
  MatchId: MatchId;
  Mutation: {};
  Player: Player;
  PlayerResult: PlayerResult;
  PlayerStats: PlayerStats;
  Query: {};
  String: Scalars['String'];
  TeamsInput: TeamsInput;
  TeamsTournamentInput: TeamsTournamentInput;
  Tournament: Tournament;
  TournamentLight: TournamentLight;
  TournamentTeam: TournamentTeam;
  UpdateLanInput: UpdateLanInput;
};

export type AchievementResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Achievement'] = ResolversParentTypes['Achievement']> = {
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  player?: Resolver<ResolversTypes['Player'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BracketOptionsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BracketOptions'] = ResolversParentTypes['BracketOptions']> = {
  advancers?: Resolver<Maybe<Array<ResolversTypes['Int']>>, ParentType, ContextType>;
  last?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  limit?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  lowerScoreIsBetter?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  short?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  sizes?: Resolver<Maybe<Array<ResolversTypes['Int']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BracketPropertiesResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BracketProperties'] = ResolversParentTypes['BracketProperties']> = {
  options?: Resolver<ResolversTypes['BracketOptions'], ParentType, ContextType>;
  seeding?: Resolver<Maybe<Array<ResolversTypes['BracketSeed']>>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BracketSeedResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['BracketSeed'] = ResolversParentTypes['BracketSeed']> = {
  nb?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  opponent?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DateTypeResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['DateType'] = ResolversParentTypes['DateType']> = {
  day?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  hour?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  min?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface FileScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['File'], any> {
  name: 'File';
}

export type GameResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Game'] = ResolversParentTypes['Game']> = {
  cover?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  picture?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  platforms?: Resolver<Array<Maybe<ResolversTypes['Int']>>, ParentType, ContextType>;
  release?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GlobalTournamentSettingsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['GlobalTournamentSettings'] = ResolversParentTypes['GlobalTournamentSettings']> = {
  default?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  leaders?: Resolver<Array<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type IgdbGameResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['IgdbGame'] = ResolversParentTypes['IgdbGame']> = {
  cover?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pictures?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  platforms?: Resolver<Array<ResolversTypes['Int']>, ParentType, ContextType>;
  release?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LanResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Lan'] = ResolversParentTypes['Lan']> = {
  defaultTournamentSettings?: Resolver<ResolversTypes['GlobalTournamentSettings'], ParentType, ContextType>;
  endDate?: Resolver<ResolversTypes['DateType'], ParentType, ContextType>;
  motd?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  partialResults?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startDate?: Resolver<ResolversTypes['DateType'], ParentType, ContextType>;
  weightTeamsResults?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LoggedInUserResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['LoggedInUser'] = ResolversParentTypes['LoggedInUser']> = {
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ip?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isAdmin?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  team?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MatchResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Match'] = ResolversParentTypes['Match']> = {
  id?: Resolver<ResolversTypes['MatchId'], ParentType, ContextType>;
  m?: Resolver<Maybe<Array<Maybe<ResolversTypes['Int']>>>, ParentType, ContextType>;
  p?: Resolver<Array<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MatchIdResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['MatchId'] = ResolversParentTypes['MatchId']> = {
  m?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  r?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  s?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  addPlayerToTournament?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationAddPlayerToTournamentArgs, 'player' | 'tournamentId'>>;
  addPlayersToTeam?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationAddPlayersToTeamArgs, 'players' | 'teamName' | 'tournamentId'>>;
  adminElevation?: Resolver<Maybe<ResolversTypes['LoggedInUser']>, ParentType, ContextType, RequireFields<MutationAdminElevationArgs, 'password'>>;
  balanceTournament?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationBalanceTournamentArgs, 'id'>>;
  editTournament?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationEditTournamentArgs, 'input'>>;
  forfeitOpponentFromTournament?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationForfeitOpponentFromTournamentArgs, 'opponent' | 'tournamentId'>>;
  login?: Resolver<Maybe<ResolversTypes['LoggedInUser']>, ParentType, ContextType, RequireFields<MutationLoginArgs, 'username'>>;
  movePlayer?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationMovePlayerArgs, 'newIndex' | 'player' | 'tournamentId'>>;
  moveTeam?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationMoveTeamArgs, 'newIndex' | 'team' | 'tournamentId'>>;
  newTournamentTeam?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationNewTournamentTeamArgs, 'teamName' | 'tournamentId'>>;
  removeGame?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationRemoveGameArgs, 'id'>>;
  removePlayerFromTournament?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationRemovePlayerFromTournamentArgs, 'player' | 'tournamentId'>>;
  removePlayersFromTeam?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationRemovePlayersFromTeamArgs, 'players' | 'tournamentId'>>;
  removeTournament?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationRemoveTournamentArgs, 'id'>>;
  removeTournamentTeam?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationRemoveTournamentTeamArgs, 'teamName' | 'tournamentId'>>;
  renameTournamentTeam?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationRenameTournamentTeamArgs, 'newTeamName' | 'oldTeamName' | 'tournamentId'>>;
  setGame?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationSetGameArgs, 'cover' | 'id' | 'name' | 'picture' | 'platforms'>>;
  setScore?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationSetScoreArgs, 'matchId' | 'player' | 'score' | 'tournamentId'>>;
  startTournament?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationStartTournamentArgs, 'id'>>;
  stopTournament?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationStopTournamentArgs, 'id'>>;
  updateLan?: Resolver<ResolversTypes['Lan'], ParentType, ContextType, RequireFields<MutationUpdateLanArgs, 'lan'>>;
  updateProfile?: Resolver<ResolversTypes['LoggedInUser'], ParentType, ContextType, Partial<MutationUpdateProfileArgs>>;
  validateTournament?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationValidateTournamentArgs, 'id'>>;
};

export type PlayerResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Player'] = ResolversParentTypes['Player']> = {
  avatar?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ips?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  isAdmin?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  team?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PlayerResultResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PlayerResult'] = ResolversParentTypes['PlayerResult']> = {
  position?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PlayerStatsResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['PlayerStats'] = ResolversParentTypes['PlayerStats']> = {
  LBwins?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  losses?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  player?: Resolver<ResolversTypes['Player'], ParentType, ContextType>;
  points?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  secondPlaces?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  tournaments?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  wins?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  achievements?: Resolver<Array<ResolversTypes['Achievement']>, ParentType, ContextType>;
  games?: Resolver<Array<ResolversTypes['Game']>, ParentType, ContextType>;
  igdbGames?: Resolver<Array<ResolversTypes['IgdbGame']>, ParentType, ContextType, RequireFields<QueryIgdbGamesArgs, 'searchCriteria'>>;
  lan?: Resolver<ResolversTypes['Lan'], ParentType, ContextType>;
  leaderboard?: Resolver<Array<ResolversTypes['PlayerStats']>, ParentType, ContextType>;
  me?: Resolver<Maybe<ResolversTypes['LoggedInUser']>, ParentType, ContextType>;
  players?: Resolver<Array<ResolversTypes['Player']>, ParentType, ContextType>;
  tournament?: Resolver<Maybe<ResolversTypes['Tournament']>, ParentType, ContextType, RequireFields<QueryTournamentArgs, 'id'>>;
  tournaments?: Resolver<Array<ResolversTypes['TournamentLight']>, ParentType, ContextType>;
};

export type TournamentResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['Tournament'] = ResolversParentTypes['Tournament']> = {
  bracketProperties?: Resolver<ResolversTypes['BracketProperties'], ParentType, ContextType>;
  comments?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  forfeitOpponents?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  game?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  globalTournamentSettings?: Resolver<ResolversTypes['GlobalTournamentSettings'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  matches?: Resolver<Maybe<Array<ResolversTypes['Match']>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  players?: Resolver<Array<ResolversTypes['Player']>, ParentType, ContextType>;
  results?: Resolver<Maybe<Array<ResolversTypes['PlayerResult']>>, ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['DateType'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['TournamentStatus'], ParentType, ContextType>;
  teams?: Resolver<Maybe<Array<ResolversTypes['TournamentTeam']>>, ParentType, ContextType>;
  teamsMaxSize?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  useTeams?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  usersCanCreateTeams?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TournamentLightResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TournamentLight'] = ResolversParentTypes['TournamentLight']> = {
  game?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  players?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  startTime?: Resolver<ResolversTypes['DateType'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['TournamentStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TournamentTeamResolvers<ContextType = GraphQLContext, ParentType extends ResolversParentTypes['TournamentTeam'] = ResolversParentTypes['TournamentTeam']> = {
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  players?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = GraphQLContext> = {
  Achievement?: AchievementResolvers<ContextType>;
  BracketOptions?: BracketOptionsResolvers<ContextType>;
  BracketProperties?: BracketPropertiesResolvers<ContextType>;
  BracketSeed?: BracketSeedResolvers<ContextType>;
  DateType?: DateTypeResolvers<ContextType>;
  File?: GraphQLScalarType;
  Game?: GameResolvers<ContextType>;
  GlobalTournamentSettings?: GlobalTournamentSettingsResolvers<ContextType>;
  IgdbGame?: IgdbGameResolvers<ContextType>;
  Lan?: LanResolvers<ContextType>;
  LoggedInUser?: LoggedInUserResolvers<ContextType>;
  Match?: MatchResolvers<ContextType>;
  MatchId?: MatchIdResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Player?: PlayerResolvers<ContextType>;
  PlayerResult?: PlayerResultResolvers<ContextType>;
  PlayerStats?: PlayerStatsResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Tournament?: TournamentResolvers<ContextType>;
  TournamentLight?: TournamentLightResolvers<ContextType>;
  TournamentTeam?: TournamentTeamResolvers<ContextType>;
};


export type LoggedInUserFragment = { __typename?: 'LoggedInUser', username: string, isAdmin: boolean, avatar?: string | null, team?: string | null, ip?: string | null };

export type LanFragment = { __typename?: 'Lan', motd: string, name: string, weightTeamsResults: boolean, partialResults: boolean, defaultTournamentSettings: { __typename?: 'GlobalTournamentSettings', leaders: Array<number>, default: number }, startDate: { __typename?: 'DateType', day: number, hour: number, min: number }, endDate: { __typename?: 'DateType', day: number, hour: number, min: number } };

export type LoginMutationVariables = Exact<{
  username?: InputMaybe<Scalars['String']>;
}>;


export type LoginMutation = { __typename?: 'Mutation', login?: { __typename?: 'LoggedInUser', username: string, isAdmin: boolean, avatar?: string | null, team?: string | null, ip?: string | null } | null };

export type AdminElevationMutationVariables = Exact<{
  password?: InputMaybe<Scalars['String']>;
}>;


export type AdminElevationMutation = { __typename?: 'Mutation', adminElevation?: { __typename?: 'LoggedInUser', username: string, isAdmin: boolean, avatar?: string | null, team?: string | null, ip?: string | null } | null };

export type EditTournamentMutationVariables = Exact<{
  id?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  game?: InputMaybe<Scalars['Int']>;
  bracketProperties?: InputMaybe<BracketPropertiesInput>;
  status?: InputMaybe<TournamentStatus>;
  useTeams?: InputMaybe<Scalars['Boolean']>;
  usersCanCreateTeams?: InputMaybe<Scalars['Boolean']>;
  teamsMaxSize?: InputMaybe<Scalars['Int']>;
  startTime?: InputMaybe<DateInput>;
  globalTournamentSettings?: InputMaybe<GlobalTournamentSettingsInput>;
  comments?: InputMaybe<Scalars['String']>;
}>;


export type EditTournamentMutation = { __typename?: 'Mutation', editTournament?: string | null };

export type MovePlayerMutationVariables = Exact<{
  tournamentId: Scalars['String'];
  player: Scalars['String'];
  newIndex: Scalars['Int'];
}>;


export type MovePlayerMutation = { __typename?: 'Mutation', movePlayer?: string | null };

export type MoveTeamMutationVariables = Exact<{
  tournamentId: Scalars['String'];
  team: Scalars['String'];
  newIndex: Scalars['Int'];
}>;


export type MoveTeamMutation = { __typename?: 'Mutation', moveTeam?: string | null };

export type NewTournamentTeamMutationVariables = Exact<{
  tournamentId: Scalars['String'];
  teamName: Scalars['String'];
}>;


export type NewTournamentTeamMutation = { __typename?: 'Mutation', newTournamentTeam?: string | null };

export type RenameTournamentTeamMutationVariables = Exact<{
  tournamentId: Scalars['String'];
  oldTeamName: Scalars['String'];
  newTeamName: Scalars['String'];
}>;


export type RenameTournamentTeamMutation = { __typename?: 'Mutation', renameTournamentTeam?: string | null };

export type RemoveTournamentTeamMutationVariables = Exact<{
  tournamentId: Scalars['String'];
  teamName: Scalars['String'];
}>;


export type RemoveTournamentTeamMutation = { __typename?: 'Mutation', removeTournamentTeam?: string | null };

export type AddPlayersToTeamMutationVariables = Exact<{
  tournamentId: Scalars['String'];
  teamName: Scalars['String'];
  players: Array<Scalars['String']> | Scalars['String'];
}>;


export type AddPlayersToTeamMutation = { __typename?: 'Mutation', addPlayersToTeam?: string | null };

export type RemovePlayersFromTeamMutationVariables = Exact<{
  tournamentId: Scalars['String'];
  players: Array<Scalars['String']> | Scalars['String'];
}>;


export type RemovePlayersFromTeamMutation = { __typename?: 'Mutation', removePlayersFromTeam?: string | null };

export type AddPlayerToTournamentMutationVariables = Exact<{
  tournamentId?: InputMaybe<Scalars['String']>;
  player?: InputMaybe<Scalars['String']>;
}>;


export type AddPlayerToTournamentMutation = { __typename?: 'Mutation', addPlayerToTournament?: string | null };

export type RemovePlayerFromTournamentMutationVariables = Exact<{
  tournamentId?: InputMaybe<Scalars['String']>;
  player?: InputMaybe<Scalars['String']>;
}>;


export type RemovePlayerFromTournamentMutation = { __typename?: 'Mutation', removePlayerFromTournament?: string | null };

export type ForfeitOpponentFromTournamentMutationVariables = Exact<{
  tournamentId?: InputMaybe<Scalars['String']>;
  opponent?: InputMaybe<Scalars['String']>;
}>;


export type ForfeitOpponentFromTournamentMutation = { __typename?: 'Mutation', forfeitOpponentFromTournament?: string | null };

export type StartTournamentMutationVariables = Exact<{
  id?: InputMaybe<Scalars['String']>;
}>;


export type StartTournamentMutation = { __typename?: 'Mutation', startTournament?: string | null };

export type BalanceTournamentMutationVariables = Exact<{
  id?: InputMaybe<Scalars['String']>;
}>;


export type BalanceTournamentMutation = { __typename?: 'Mutation', balanceTournament?: string | null };

export type StopTournamentMutationVariables = Exact<{
  id?: InputMaybe<Scalars['String']>;
}>;


export type StopTournamentMutation = { __typename?: 'Mutation', stopTournament?: string | null };

export type ValidateTournamentMutationVariables = Exact<{
  id?: InputMaybe<Scalars['String']>;
}>;


export type ValidateTournamentMutation = { __typename?: 'Mutation', validateTournament?: string | null };

export type RemoveTournamentMutationVariables = Exact<{
  id?: InputMaybe<Scalars['String']>;
}>;


export type RemoveTournamentMutation = { __typename?: 'Mutation', removeTournament?: string | null };

export type SetScoreMutationVariables = Exact<{
  tournamentId: Scalars['String'];
  matchId: IdInput;
  player: Scalars['Int'];
  score: Scalars['Int'];
}>;


export type SetScoreMutation = { __typename?: 'Mutation', setScore?: string | null };

export type UpdateLanMutationVariables = Exact<{
  motd?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  defaultTournamentSettings?: InputMaybe<GlobalTournamentSettingsInput>;
  weightTeamsResults?: InputMaybe<Scalars['Boolean']>;
  partialResults?: InputMaybe<Scalars['Boolean']>;
  startDate?: InputMaybe<DateInput>;
  endDate?: InputMaybe<DateInput>;
}>;


export type UpdateLanMutation = { __typename?: 'Mutation', updateLan: { __typename?: 'Lan', motd: string, name: string, weightTeamsResults: boolean, partialResults: boolean, defaultTournamentSettings: { __typename?: 'GlobalTournamentSettings', leaders: Array<number>, default: number }, startDate: { __typename?: 'DateType', day: number, hour: number, min: number }, endDate: { __typename?: 'DateType', day: number, hour: number, min: number } } };

export type UpdateProfileMutationVariables = Exact<{
  avatarFile?: InputMaybe<Scalars['File']>;
  team?: InputMaybe<Scalars['String']>;
  removeAvatar?: InputMaybe<Scalars['Boolean']>;
}>;


export type UpdateProfileMutation = { __typename?: 'Mutation', updateProfile: { __typename?: 'LoggedInUser', username: string, isAdmin: boolean, avatar?: string | null, team?: string | null, ip?: string | null } };

export type SetGameMutationVariables = Exact<{
  id: Scalars['Int'];
  name: Scalars['String'];
  platforms: Array<Scalars['Int']> | Scalars['Int'];
  cover: Scalars['String'];
  picture: Scalars['String'];
  release?: InputMaybe<Scalars['Int']>;
}>;


export type SetGameMutation = { __typename?: 'Mutation', setGame?: string | null };

export type RemoveGameMutationVariables = Exact<{
  id: Scalars['Int'];
}>;


export type RemoveGameMutation = { __typename?: 'Mutation', removeGame?: string | null };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'LoggedInUser', username: string, isAdmin: boolean, avatar?: string | null, team?: string | null, ip?: string | null } | null };

export type PlayersQueryVariables = Exact<{ [key: string]: never; }>;


export type PlayersQuery = { __typename?: 'Query', players: Array<{ __typename?: 'Player', isAdmin?: boolean | null, username: string, avatar?: string | null, team?: string | null, ips?: Array<string> | null }> };

export type TournamentsQueryVariables = Exact<{ [key: string]: never; }>;


export type TournamentsQuery = { __typename?: 'Query', tournaments: Array<{ __typename?: 'TournamentLight', id: string, name: string, game: number, status: TournamentStatus, players: Array<string>, startTime: { __typename?: 'DateType', day: number, hour: number, min: number } }> };

export type TournamentQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type TournamentQuery = { __typename?: 'Query', tournament?: { __typename?: 'Tournament', id: string, name: string, game: number, status: TournamentStatus, forfeitOpponents?: Array<string> | null, useTeams: boolean, usersCanCreateTeams?: boolean | null, teamsMaxSize?: number | null, comments: string, bracketProperties: { __typename?: 'BracketProperties', type: string, options: { __typename?: 'BracketOptions', last?: number | null, short?: boolean | null, lowerScoreIsBetter?: boolean | null, sizes?: Array<number> | null, advancers?: Array<number> | null, limit?: number | null }, seeding?: Array<{ __typename?: 'BracketSeed', nb: number, opponent: string }> | null }, matches?: Array<{ __typename?: 'Match', p: Array<number>, m?: Array<number | null> | null, id: { __typename?: 'MatchId', s: number, r: number, m: number } }> | null, players: Array<{ __typename?: 'Player', username: string, avatar?: string | null, team?: string | null, ips?: Array<string> | null }>, teams?: Array<{ __typename?: 'TournamentTeam', name: string, players: Array<string> }> | null, startTime: { __typename?: 'DateType', day: number, hour: number, min: number }, globalTournamentSettings: { __typename?: 'GlobalTournamentSettings', leaders: Array<number>, default: number }, results?: Array<{ __typename?: 'PlayerResult', username: string, position: number }> | null } | null };

export type LanQueryVariables = Exact<{ [key: string]: never; }>;


export type LanQuery = { __typename?: 'Query', lan: { __typename?: 'Lan', motd: string, name: string, weightTeamsResults: boolean, partialResults: boolean, defaultTournamentSettings: { __typename?: 'GlobalTournamentSettings', leaders: Array<number>, default: number }, startDate: { __typename?: 'DateType', day: number, hour: number, min: number }, endDate: { __typename?: 'DateType', day: number, hour: number, min: number } } };

export type LeaderboardQueryVariables = Exact<{ [key: string]: never; }>;


export type LeaderboardQuery = { __typename?: 'Query', leaderboard: Array<{ __typename?: 'PlayerStats', points: number, wins: number, losses: number, LBwins: number, secondPlaces: number, tournaments: number, player: { __typename?: 'Player', username: string, avatar?: string | null, team?: string | null } }> };

export type AchievementsQueryVariables = Exact<{ [key: string]: never; }>;


export type AchievementsQuery = { __typename?: 'Query', achievements: Array<{ __typename?: 'Achievement', name: string, description: string, player: { __typename?: 'Player', username: string, avatar?: string | null, team?: string | null } }> };

export type GamesQueryVariables = Exact<{ [key: string]: never; }>;


export type GamesQuery = { __typename?: 'Query', games: Array<{ __typename?: 'Game', id: number, name: string, platforms: Array<number | null>, cover: string, picture: string, release?: number | null }> };

export type IgdbGamesQueryVariables = Exact<{
  searchCriteria: Scalars['String'];
  idToSearch?: InputMaybe<Scalars['Int']>;
}>;


export type IgdbGamesQuery = { __typename?: 'Query', igdbGames: Array<{ __typename?: 'IgdbGame', id: number, name: string, platforms: Array<number>, cover: string, pictures: Array<string>, release?: number | null }> };
