import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from "@remix-run/node"
import { Form, useFetcher, useLoaderData } from "@remix-run/react"
import { SearchSVG } from "~/lib/components/data/svg-container"
import { AddOrUpdateGameRepresentation, addOrUpdateGame, searchGames } from "./add-games.queries.server"
import { useEffect, useState } from "react"
import { useGames } from "~/lib/components/contexts/GamesContext"
import { CustomButton } from "~/lib/components/elements/custom-button"
import { CustomModalBinary } from "~/lib/components/elements/custom-modal"
import { getLan } from "~/lib/persistence/lan.server"
import { clickorkey } from "~/lib/utils/clickorkey"
import { requireUserAdmin } from "~/lib/session.server"

interface GameInfo {
    id: number,
    name: string,
    platforms: number[],
    cover: string,
    pictures: string[],
    release?: number
}

enum GameManagementIntents {
    ADD_GAME = "addGame",
    REMOVE_GAME = "removeGame",
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
    return [
        { title: data?.lanName + " - Ajout de jeu" }
    ]
}

export async function action({ request }: ActionFunctionArgs) {
    const jsonData = await request.json()
    const intent = jsonData.intent as string
    let partialGame: AddOrUpdateGameRepresentation
    switch (intent) {
        case GameManagementIntents.ADD_GAME:
            partialGame = jsonData.data
            addOrUpdateGame(partialGame)
            return redirect("/admin")
        case GameManagementIntents.REMOVE_GAME:
            break
    }

    return null
}

export async function loader({ request }: LoaderFunctionArgs) {
    await requireUserAdmin(request)
    const url = new URL(request.url)
    const query = url.searchParams.get("query")

    const games = await searchGames(query)
    return json({ lanName: getLan().name, gameSearchResults: games, query })
}

export default function AddGames() {
    const { gameSearchResults, query } = useLoaderData<typeof loader>()
    const [gameToConfigure, setGameToConfigure] = useState<GameInfo | undefined>(undefined)
    const lanGames = useGames()
    const [selectedImage, setSelectedImage] = useState(lanGames.find(game => game.id == gameToConfigure?.id)?.picture || "")
    const [showDeleteGame, setShowDeleteGame] = useState(false)
    const fetcher = useFetcher()

    useEffect(() => {
        setSelectedImage(lanGames.find(game => game.id == gameToConfigure?.id)?.picture || "")
    }, [gameToConfigure, lanGames])


    useEffect(() => {
        if (gameSearchResults.length == 1) {
            setGameToConfigure(gameSearchResults[0])
        } else {
            setGameToConfigure(undefined)
        }
    }, [gameSearchResults])

    const handleRemoveGame = () => {
        if (!gameToConfigure) return
        fetcher.submit(
            {
                intent: GameManagementIntents.REMOVE_GAME,
                gameId: gameToConfigure.id
            },
            { method: "POST" }
        )
    }

    const handleSetGame = () => {
        if (!gameToConfigure) return
        fetcher.submit(
            {
                intent: GameManagementIntents.ADD_GAME,
                data: {
                    id: gameToConfigure.id,
                    name: gameToConfigure.name,
                    platforms: gameToConfigure.platforms,
                    cover: gameToConfigure.cover,
                    picture: selectedImage
                } as AddOrUpdateGameRepresentation
            },
            { method: "POST", encType: "application/json" }
        )
    }

    return (
        <div className="manageGames is-full-height is-flex p-3 gap-3">
            {/* New game selection */}
            <div className='is-flex-col gap-2 is-full-height has-background-secondary-level p-3 is-relative is-one-quarter'>
                <div className='is-title medium'>Nouveau jeu</div>
                <Form method="GET">
                    <div className='is-flex gap-2 align-stretch'>
                        <input type="text" name="query" defaultValue={query || ""} placeholder='Jeu à rechercher...' className='grow no-basis is-full-height pl-1' />
                        <button type="submit" className='customButton has-background-primary-accent is-flex fade-on-mouse-out px-2 align-center is-clickable' style={{width: "80px", height: "34px"}}>
                            <SearchSVG />
                        </button>
                    </div>
                </Form>
                <div className='grow has-background-primary-level is-scrollable is-relative'>
                    {gameSearchResults.map(game =>
                        <div key={game.id} className={`selectable ${game.id == gameToConfigure?.id && 'is-active'} px-1 py-2 m-0 is-clickable is-flex align-center gap-2`} {...clickorkey(() => setGameToConfigure(game))}>
                            <img className='is-full-height' src={`/igdb_image/t_cover_small/${game.cover}.jpg`} alt=""/>
                            <div className='is-flex-col is-clipped' style={{}}>
                                <div className='is-clipped' style={{ lineHeight: "1.5rem", textOverflow: "ellipsis" }}>{game.name}</div>
                                {game.release && <div className='fade-text is-size-6' style={{ lineHeight: "1rem" }}>{game.release}</div>}
                            </div>
                        </div>
                    )}
                    {gameSearchResults.length == 0 && <div className='fade-text has-text-centered is-size-6 mt-2'>Utilise le champ de recherche pour lister des jeux ici.</div>}
                </div>
            </div>
            {/* New game options */}
            <div className='is-flex-col has-background-secondary-level p-3 align-strech is-full-height grow no-basis'>
                {gameToConfigure ?
                    <div className='is-full-height is-flex-col align-center'>
                        <div className='is-title medium is-full-width'>Configuration du jeu</div>
                        <div className='is-flex align-center gap-3'>
                            <img src={`/igdb_image/t_cover_small/${gameToConfigure.cover}.jpg`} alt="" style={{height: "8rem"}}/>
                            <div className='is-flex-col justify-space-evenly is-full-height'>
                                <div className='is-title medium'>{gameToConfigure.name}</div>
                                <div className='fade-text'>{gameToConfigure.release}</div>
                                <div className='is-flex gap-2 fade-text'>
                                    {[3, 6, 14].some(p => gameToConfigure.platforms?.includes(p)) && <div>PC</div>}
                                    {[7, 8, 9, 48, 131, 167].some(p => gameToConfigure.platforms?.includes(p)) && <div>PS</div>}
                                    {[11, 12, 49, 169].some(p => gameToConfigure.platforms?.includes(p)) && <div>Xbox</div>}
                                </div>
                            </div>
                        </div>
                        <div className='mt-4 mb-2'>Sélectionne l&apos;image à utiliser pour ce jeu</div>
                        <div className='is-flex gap-3 wrap is-scrollable justify-center'>
                            {gameToConfigure.pictures.map(pictureURL =>
                                <img
                                    key={pictureURL}
                                    className={`selectable is-clickable ${pictureURL == selectedImage ? 'is-active' : ''}`}
                                    src={`/igdb_image/t_720p/${pictureURL}.jpg`}
                                    alt="" {...clickorkey(() => setSelectedImage(selectedImage == pictureURL ? '' : pictureURL))}
                                    style={{height: "15rem"}}
                                />
                            )}
                        </div>
                        <div className='mt-4 is-full-width is-flex justify-end'>
                            {lanGames && lanGames.filter(game => game.id == gameToConfigure.id).length > 0 && <CustomButton callback={() => setShowDeleteGame(true)} contentItems={["Supprimer le jeu"]} customClasses="has-background-primary-level" />}
                            <CustomModalBinary
                                show={showDeleteGame}
                                onHide={() => setShowDeleteGame(false)}
                                cancelButton={true}
                                onConfirm={handleRemoveGame}
                                content={
                                    <div className='is-flex align-stretch px-6 py-4 gap-4'>
                                        <div className="has-background-primary-accent pl-1"></div>
                                        <div className='is-size-5'>Es-tu sûr de vouloir supprimer le jeu {gameToConfigure.name} ?</div>
                                    </div>
                                }
                            />
                            <CustomButton callback={handleSetGame} tooltip={(lanGames && lanGames.filter(game => game.id == gameToConfigure.id).length > 0) ? "modifier l'image du jeu" : undefined} contentItems={(lanGames && lanGames.filter(game => game.id == gameToConfigure.id).length > 0) ? ["Editer le jeu"] : ["Ajouter le jeu"]} active={selectedImage != ''} colorClass="has-background-primary-accent" customClasses='ml-3' />
                        </div>

                    </div>
                    :
                    <div className='is-full-height is-flex align-center justify-center fade-text'>Sélectionne un jeu pour le configurer</div>
                }
            </div>
        </div>
    )
}