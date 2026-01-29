import { GetServerSideProps } from 'next'
import { useTranslation } from 'next-i18next'
import type { Episode } from 'podverse-shared'
import {
  ColumnsWrapper,
  EpisodePageHeader,
  Footer,
  Meta,
  PageScrollableContent,
  SideContent,
  SvenskaLearningPanel
} from '~/components'
import { Page } from '~/lib/utility/page'
import { PV } from '~/resources'
import { getEpisodeById } from '~/services/episode'
import { getDefaultServerSideProps, getServerSidePropsWrapper } from '~/services/serverSideHelpers'

interface ServerProps extends Page {
  serverCookies: any
  serverEpisode: Episode
}

const keyPrefix = 'pages_svenska_learning'

export default function SvenskaLearningPage({
  serverCookies,
  serverEpisode
}: ServerProps) {
  const { t } = useTranslation()

  /* Meta Tags */
  const podcastTitle = serverEpisode?.podcast?.title || t('untitledPodcast')
  const episodeTitle = serverEpisode?.title || t('untitledEpisode')
  const meta = {
    currentUrl: `${PV.Config.WEB_BASE_URL}${PV.RoutePaths.web.svenskaLearning}/${serverEpisode?.id}`,
    description: `${t('Svenska Learning')}: ${episodeTitle}`,
    title: `${t('Svenska Learning')} - ${episodeTitle} - ${podcastTitle}`
  }

  return (
    <>
      <Meta
        description={meta.description}
        ogDescription={meta.description}
        ogTitle={meta.title}
        ogType='website'
        ogUrl={meta.currentUrl}
        robotsNoIndex={false}
        title={meta.title}
        twitterDescription={meta.description}
        twitterTitle={meta.title}
      />
      <EpisodePageHeader episode={serverEpisode} />
      <PageScrollableContent>
        <ColumnsWrapper mainColumnChildren={
          <SvenskaLearningPanel episode={serverEpisode} />
        } />
        <Footer />
      </PageScrollableContent>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) =>
  getServerSidePropsWrapper(async () => {
    const { locale, params } = ctx
    const { episodeId } = params

    const defaultServerProps = await getDefaultServerSideProps(ctx, locale)
    const episodeResponse = await getEpisodeById(episodeId as string)
    const serverEpisode = episodeResponse?.data

    if (!serverEpisode) {
      return {
        notFound: true
      }
    }

    const serverProps: ServerProps = {
      ...defaultServerProps,
      serverEpisode
    }

    return {
      props: serverProps
    }
  })
