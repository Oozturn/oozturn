import { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction, json, redirect } from "@remix-run/node";
import { Form, useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { SearchSVG } from "~/lib/components/data/svg-container"
import { AddOrUpdateGameRepresentation, addOrUpdateGame, searchGames } from "./queries.server";
import { useEffect, useState } from "react";
import { useGames } from "~/lib/components/contexts/GamesContext";
import { CustomButton } from "~/lib/components/elements/custom-button";
import { CustomModalBinary } from "~/lib/components/elements/custom-modal";
import { useLan } from "~/lib/components/contexts/LanContext";

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

export const meta: MetaFunction = () => {
    return [
        { title: useLan().name + " - Ajout de jeu" }
    ]
}

export async function action({ request }: ActionFunctionArgs) {
    const jsonData = await request.json()
    const intent = jsonData.intent as string

    switch (intent) {
        case GameManagementIntents.ADD_GAME:
            let partialGame = jsonData.data as AddOrUpdateGameRepresentation
            addOrUpdateGame(partialGame)
            return redirect("/admin")
        case GameManagementIntents.REMOVE_GAME:
            break;
    }

    return null
}

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const query = url.searchParams.get("query");

    const games = await searchGames(query)
    return json({ gameSearchResults: games, query });
};

export default function AddGames() {
    const { gameSearchResults, query } = useLoaderData<typeof loader>();
    const [gameToConfigure, setGameToConfigure] = useState<GameInfo | undefined>(undefined)
    const [selectedImage, setSelectedImage] = useState("")
    const [showDeleteGame, setShowDeleteGame] = useState(false)
    const fetcher = useFetcher()

    const lanGames = useGames()

    useEffect(() => {
        if (gameSearchResults.length == 1) {
            setGameToConfigure(gameSearchResults[0])
        } else {
            setGameToConfigure(undefined)
        }
    }, [gameSearchResults])

    const navigate = useNavigate()

    const handleClose = () => {
        navigate(-1);
    };

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
        <div className="is-full-height is-flex p-3 manageGames">
            <div className='selectGameColumn is-flex is-flex-direction-column'>
                {/* New game selection */}
                <div className='newGame is-flex is-flex-direction-column has-background-secondary-level p-3 is-relative'>
                    <div className='is-title medium'>Nouveau jeu</div>
                    <Form method="GET">
                        <div className='is-flex is-align-items-stretch'>
                            <input type="text" name="query" defaultValue={query || ""} placeholder='Jeu à rechercher...' className='is-flex-grow-1' />
                            <div className='mx-1'></div>
                            <button type="submit" className='has-background-primary-accent is-flex fade-on-mouse-out px-2 is-align-items-center is-clickable'>
                                <SearchSVG />
                            </button>
                        </div>
                    </Form>
                    <div className='gamesList is-flex-grow-1 has-background-primary-level is-scrollable is-relative'>
                        {gameSearchResults.map(game =>
                            <div key={game.id} className={`gameTile ${game.id == gameToConfigure?.id && 'is-active'} px-1 py-2 m-0 is-clickable is-flex is-align-items-center`} onClick={() => { setGameToConfigure(game) }}>
                                <img className='is-full-height' src={`/igdb_image/t_cover_small/${game.cover}.jpg`} alt="" />
                                <div className='is-flex is-flex-direction-column'>
                                    <div className='ml-2' style={{ lineHeight: "1.5rem" }}>{game.name}</div>
                                    {game.release && <div className='ml-2 fade-text is-size-6' style={{ lineHeight: "1rem" }}>{game.release}</div>}
                                </div>
                            </div>
                        )}
                        {gameSearchResults.length == 0 && <div className='fade-text has-text-centered is-size-6 mt-2'>Utilise le champ de recherche pour lister des jeux ici.</div>}
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
                                <img key={pictureURL} className={`imageToSelect m-0 p-0 is-clickable ${pictureURL == selectedImage ? 'is-active' : ''}`} src={`/igdb_image/t_720p/${pictureURL}.jpg`} alt="" onClick={() => { setSelectedImage(selectedImage == pictureURL ? '' : pictureURL) }} />
                            )}
                        </div>
                        <div className='mt-4 is-full-width is-flex is-justify-content-end'>
                            {lanGames && lanGames.filter(game => game.id == gameToConfigure.id).length > 0 && <CustomButton callback={() => setShowDeleteGame(true)} contentItems={["Supprimer le jeu"]} customClasses="has-background-primary-level" />}
                            <CustomModalBinary
                                show={showDeleteGame}
                                onHide={() => setShowDeleteGame(false)}
                                cancelButton={true}
                                onConfirm={handleRemoveGame}
                                content={
                                    <div className='is-flex is-align-items-stretch pt-5 pl-5 pb-4'>
                                        <div className="has-background-primary-accent pl-1 mt-2 mx-4"></div>
                                        <div>
                                            <div className='is-size-5'>Es-tu sûr de vouloir supprimer le jeu {gameToConfigure.name} ?</div>
                                        </div>
                                    </div>
                                }
                            />
                            <CustomButton callback={handleSetGame} tooltip={(lanGames && lanGames.filter(game => game.id == gameToConfigure.id).length > 0) ? "modifier l'image du jeu" : undefined} contentItems={(lanGames && lanGames.filter(game => game.id == gameToConfigure.id).length > 0) ? ["Editer le jeu"] : ["Ajouter le jeu"]} active={selectedImage != ''} colorClass="has-background-primary-accent" customClasses='ml-3' />
                        </div>

                    </div>
                    :
                    <div className='is-full-height is-flex is-align-items-center is-justify-content-center fade-text'>Sélectionne un jeu pour le configurer</div>
                }
            </div>
        </div>
    )
}