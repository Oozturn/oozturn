import Head from 'next/head'
import { useState } from 'react'
import { mutate } from "swr"
import { client } from '../lib/gql/client'
import { GET_GAMES_QUERY, REMOVE_GAME_MUTATION, SEARCH_IGDB_GAMES, SET_GAME_MUTATION } from '../lib/gql/operations/operations'
import { useGames, useLan, useMe } from '../lib/hooks'
import { IgdbGamesQuery, IgdbGamesQueryVariables, RemoveGameMutation, RemoveGameMutationVariables, SetGameMutation, SetGameMutationVariables } from '../__generated__/gql/types'
import { CustomModalBinary, CustomModalSimpleAck } from '../components/elements/custom-modal'
import { CustomButton } from '../components/elements/custom-button'
import { removeNulls } from '../lib/utils'
import { SearchSVG } from '../lib/data/svg-container'

export default function ManageGamesPage() {
  const { data: meResult, error: meError } = useMe()
  const { data: lanResult, error: lanError } = useLan()
  const user = meResult?.me

  return (
    <>
      <Head>
        <title>{lanResult?.lan.name || ""} - Admin</title>
      </Head>

      {user?.isAdmin ?
        <ManageGamesContent />
        :
        <div className='is-flex is-full-height is-align-items-strecth is-justify-content-center'>
          <div className='is-flex is-align-items-center mb-6'>Il faut être admin pour voir ça. T&apos;es admin ?</div>
        </div>
      }

    </>
  )
}

interface GameInfo {
  id:number,
  name: string,
  platforms: number[],
  cover: string,
  pictures: string[],
  release?: number
}

export function ManageGamesContent() {
  const [ gameToSearch, setGameToSearch ] = useState("")
  const [ gameToConfigure, setGameToConfigure ] = useState(undefined as GameInfo | undefined)
  const [ gameSearchResults, setGameSearchResults ] = useState([] as GameInfo[])
  const [ selectedImage, setSelectedImage ] = useState("")
  const [ showDeleteGame, setShowDeleteGame] = useState(false)

  const { data: gamesResult, error: gamesError } = useGames()
  const lanGames = gamesResult?.games

  async function searchGame(nameToSearch: string, idToSearch?: number) {
    const games: GameInfo[] = []

    const response = await client.request<IgdbGamesQuery,IgdbGamesQueryVariables>(SEARCH_IGDB_GAMES, {searchCriteria:nameToSearch, idToSearch:idToSearch})
    games.push(...removeNulls(response.igdbGames))
    setGameSearchResults(games)
    if (games.length == 1) {
      setGameToConfigure(games[0])
    } else {
      setGameToConfigure(undefined)
    } 
  }

  async function setGame() {
    if (!gameToConfigure) return

    await client.request<SetGameMutation, SetGameMutationVariables>(SET_GAME_MUTATION, { id: gameToConfigure.id, name: gameToConfigure.name, platforms: gameToConfigure.platforms, cover: gameToConfigure.cover, picture: selectedImage, release: gameToConfigure.release })

    await mutate(GET_GAMES_QUERY)
  }

  async function removeGame() {
    if (!gameToConfigure) return

    await client.request<RemoveGameMutation, RemoveGameMutationVariables>(REMOVE_GAME_MUTATION, { id: gameToConfigure.id })

    await mutate(GET_GAMES_QUERY)
  }

  return (
    <div className="is-full-height is-flex p-3 manageGames">
      <div className='selectGameColumn is-flex is-flex-direction-column'>
        {/* New game selection */}
        <div className='newGame is-flex is-flex-direction-column has-background-secondary-level p-3 is-relative'>
          <div className='is-title medium'>Nouveau jeu</div>
          <div className='is-flex is-align-items-stretch'>
            <input className='is-flex-grow-1' type="text" placeholder='Jeu à rechercher...' value={gameToSearch} onChange={(e) => setGameToSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchGame(gameToSearch)}/>
            <div className='mx-1'></div>
            <div className='has-background-primary-accent is-flex fade-on-mouse-out px-2 is-align-items-center is-clickable' onClick={() => searchGame(gameToSearch)}>
              <SearchSVG />
            </div>
          </div>
          <div className='gamesList is-flex-grow-1 has-background-primary-level is-scrollable is-relative'>
            {gameSearchResults.map(game => 
              <div key={game.id} className={`gameTile ${game.id == gameToConfigure?.id && 'is-active'} px-1 py-2 m-0 is-clickable is-flex is-align-items-center`} onClick={() => {setGameToConfigure(game)}}>
                <img className='is-full-height' src={`/igdb_image/t_cover_small/${game.cover}.jpg`} alt="" />
                <div className='is-flex is-flex-direction-column'>
                  <div className='ml-2' style={{lineHeight:"1.5rem"}}>{game.name}</div>
                  {game.release && <div className='ml-2 fade-text is-size-6'  style={{lineHeight:"1rem"}}>{game.release}</div>}
                </div>
              </div>
            )}
            {gameSearchResults.length == 0 && <div className='fade-text has-text-centered is-size-6 mt-2'>Utilise le champ de recherche pour lister des jeux ici.</div>}
          </div>
        </div>
        {/* LAN games */}
        <div className='lanGames is-flex-grow-1 is-flex is-flex-direction-column has-background-secondary-level p-3'>
          <div className='is-title medium'>Jeux de la LAN</div>
          <div className='gamesList is-flex-grow-1 has-background-primary-level is-scrollable is-full-height'>
            {lanGames?.filter(game => game.id != -1).map(game => 
              <div key={game.id} className={`gameTile ${game.id == gameToConfigure?.id && 'is-active'} px-1 py-2 m-0 is-clickable is-flex`} onClick={() => {setGameToSearch(game.name); searchGame(game.name, game.id)}}>
                <img className='is-full-height' src={`/igdb_image/t_cover_small/${game.cover}.jpg`} alt="" />
                <div className='is-flex is-flex-direction-column'>
                  <div className='ml-2' style={{lineHeight:"1.5rem"}}>{game.name}</div>
                  {game.release && <div className='ml-2 fade-text is-size-6'  style={{lineHeight:"1rem"}}>{game.release}</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* New game options */}
      <div className='configureGame is-flex is-flex-direction-column has-background-secondary-level p-3 is-align-items-strech is-full-height'>
        {gameToConfigure ?
          <div className='is-full-height is-flex is-flex-direction-column is-align-items-center'>
            <div className='is-title medium is-full-width'>Configuration du jeu</div>
            <div className='gameInfo is-flex is-align-items-center'>
              <img src={`/igdb_image/t_cover_small/${gameToConfigure.cover}.jpg`} alt="" />
              <div className='ml-3 is-flex is-flex-direction-column is-justify-content-space-evenly is-full-height'>
                <div className='is-title medium mr-6'>{gameToConfigure.name}</div>
                <div className='fade-text mr-6'>{gameToConfigure.release}</div>
                <div className='fade-text platforms is-flex'>
                  {/* Include logos here, and move this code to a dedicated function */}
                  {[3, 6, 14].filter(p => gameToConfigure.platforms?.includes(p)).length > 0 && <div>PC</div>}
                  {[7, 8, 9, 48, 131, 167].filter(p => gameToConfigure.platforms?.includes(p)).length > 0 && <div>PS</div>}
                  {[11, 12, 49, 169].filter(p => gameToConfigure.platforms?.includes(p)).length > 0 && <div>Xbox</div>}
                </div>
              </div>
            </div>
            <div className='mt-4'>Sélectionne l&apos;image à utiliser pour ce jeu</div>
            <div className='picturesList is-flex is-flex-wrap-wrap is-scrollable is-justify-content-center'>
              {gameToConfigure.pictures.map(pictureURL =>
                <img key={pictureURL} className={`imageToSelect m-0 p-0 is-clickable ${pictureURL == selectedImage ? 'is-active' : ''}`} src={`/igdb_image/t_720p/${pictureURL}.jpg`} alt=""  onClick={() => {setSelectedImage(selectedImage == pictureURL ? '' : pictureURL)}}/>
              )}
            </div>
            <div className='mt-4 is-full-width is-flex is-justify-content-end'>
              {lanGames && lanGames.filter(game => game.id == gameToConfigure.id).length > 0 && <CustomButton callback={() => setShowDeleteGame(true)} contentItems={["Supprimer le jeu"]} customClasses="has-background-primary-level"/>}
              <CustomModalBinary
                show={showDeleteGame}
                onHide={() => setShowDeleteGame(false)}
                cancelButton={true}
                onConfirm={removeGame}
                content={
                  <div className='is-flex is-align-items-stretch pt-5 pl-5 pb-4'>
                    <div className="has-background-primary-accent pl-1 mt-2 mx-4"></div>
                    <div>
                      <div className='is-size-5'>Es-tu sûr de vouloir supprimer le jeu {gameToConfigure.name} ?</div>
                    </div>
                  </div>
                }
              />
              <CustomButton callback={setGame} tooltip={(lanGames && lanGames.filter(game => game.id == gameToConfigure.id).length > 0) ? "modifier l'image du jeu" : undefined} contentItems={(lanGames && lanGames.filter(game => game.id == gameToConfigure.id).length > 0) ? ["Editer le jeu"] : ["Ajouter le jeu"]} active={selectedImage != ''} colorClass="has-background-primary-accent" customClasses='ml-3' />
            </div>

          </div>
          :
          <div className='is-full-height is-flex is-align-items-center is-justify-content-center fade-text'>Sélectionne un jeu pour le configurer</div>
        }
      </div>
    </div>
  ) 
}
