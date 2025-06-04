import { Form, json, useActionData, useFetcher, useLoaderData } from "@remix-run/react"
import { ChangeEvent, useState } from "react"
import { notifyError } from "../notification"
import { clickorkey } from "~/lib/utils/clickorkey"
import { CloseCrossSVG, SearchSVG } from "../data/svg-container"
import { CustomButton } from "../elements/custom-button"
import { searchGames } from "~/pages/admin/igdb-games.queries.server"
import { LoaderFunctionArgs } from "@remix-run/node"
import { action, gameInfo, Intents } from "~/pages/tournaments/api"
import { autoSubmit } from "~/lib/utils/autosubmit"

interface IgdbGamePictureModalProps {
  currentPicture: string | undefined
  show: boolean
  onHide: () => void
}

export default function IgdbGamePictureModal({ currentPicture, show, onHide }: IgdbGamePictureModalProps) {
  const actionData = useActionData<typeof action>()
  const games = actionData?.games || []

  const [selectedGame, setSelectedGame] = useState<gameInfo | undefined>()
  const [selectedImage, setSelectedImage] = useState(currentPicture || "")
  const fetcherUpdatePicture = useFetcher()
  const fetcherUpdateSearch = useFetcher()

  if (!show) {
    return null
  }

  const handleSetPicture = () => {
    if (!selectedGame) return
    fetcherUpdatePicture.submit(
      {
        intent: Intents.IGDB_TOURNAMENT_PIC,
        picture: selectedImage
      },
      { method: "POST", encType: "application/json", action: "/tournaments/api" }
    )
  }

  return (
    <div className="modal is-active">
      <div className="modal-background" {...clickorkey(onHide)}></div>
      <div className="modal-content">
        <div className="navbarUserCustomisationModal customModal is-flex align-stretch has-background-secondary-level pt-6 pl-6 pb-5">
          <div className="close is-clickable fade-on-mouse-out" {...clickorkey(onHide)}>
            <CloseCrossSVG />
          </div>
          <div className="manageGames is-full-height is-flex p-3 gap-3">
            {/* Game selection */}
            <div className='is-flex-col gap-2 is-full-height has-background-secondary-level p-3 is-relative is-one-quarter'>

              <fetcherUpdateSearch.Form method="POST">
                <input type="hidden" name="intent" value={Intents.SEARCH_GAMES} />
                <div className='is-flex gap-2 align-stretch'>
                  <input type="text" name="gameName" defaultValue={""} placeholder='Jeu à rechercher...' className='grow no-basis is-full-height pl-1' />
                  <button type="submit" className='customButton has-background-primary-accent is-flex fade-on-mouse-out px-2 align-center is-clickable' style={{ width: "80px", height: "34px" }}>
                    <SearchSVG />
                  </button>
                </div>
              </fetcherUpdateSearch.Form>

              <div className='grow has-background-primary-level is-scrollable is-relative'>
                {games.map(game =>
                  <div key={game.name} className={`selectable ${game.name == selectedGame?.name && 'is-active'} px-1 py-2 m-0 is-clickable is-flex align-center gap-2`} {...clickorkey(() => setSelectedGame(game))}>
                    <img className='is-full-height' src={`https://images.igdb.com/igdb/image/upload/t_cover_small/${game.cover}.jpg`} alt="" />
                    <div className='is-flex-col is-clipped' style={{}}>
                      <div className='is-clipped' style={{ lineHeight: "1.5rem", textOverflow: "ellipsis" }}>{game.name}</div>
                    </div>
                  </div>
                )}
                {games.length == 0 && <div className='fade-text has-text-centered is-size-6 mt-2'>Utilise le champ de recherche pour lister des jeux ici.</div>}
              </div>
            </div>
            {/* New game options */}
            <div className='is-flex-col has-background-secondary-level p-3 align-strech is-full-height grow no-basis'>
              {selectedGame != undefined ?
                <div className='is-full-height is-flex-col align-center'>
                  <div className='is-title medium is-full-width'>Sélection de l&apos;image</div>
                  <div className='is-flex align-center gap-3'>
                    <img src={`https://images.igdb.com/igdb/image/upload/t_cover_small/${selectedGame.cover}.jpg`} alt="" style={{ height: "8rem" }} />
                    <div className='is-flex-col justify-space-evenly is-full-height'>
                      <div className='is-title medium'>{selectedGame.name}</div>
                    </div>
                  </div>
                  <div className='mt-4 mb-2'>Sélectionne l&apos;image à utiliser pour ce jeu</div>
                  <div className='is-flex gap-3 wrap is-scrollable justify-center'>
                    {selectedGame.pictures.map(pictureURL =>
                      <img
                        key={pictureURL}
                        className={`selectable is-clickable ${pictureURL == selectedImage ? 'is-active' : ''}`}
                        src={`https://images.igdb.com/igdb/image/upload/t_720p/${pictureURL}.jpg`}
                        alt="" {...clickorkey(() => setSelectedImage(selectedImage == pictureURL ? '' : pictureURL))}
                        style={{ height: "15rem" }}
                      />
                    )}
                  </div>
                  <div className='mt-4 is-full-width is-flex justify-end'>
                    <CustomButton callback={handleSetPicture} contentItems={["Choisir cette image"]} active={selectedImage != ''} colorClass="has-background-primary-accent" customClasses='ml-3' />
                  </div>

                </div>
                :
                <div className='is-full-height is-flex align-center justify-center fade-text'>Sélectionne un jeu pour le configurer</div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
