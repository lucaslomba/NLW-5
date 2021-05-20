import { GetStaticPaths, GetStaticProps } from 'next';
import { api } from '../../services/api';
import Image from 'next/image'
import { format, parseISO } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import { convertDurationToTimeString } from '../../utils/convertDurationToTimeString'
import { PlayerContext } from '../../contexts/PlayerContext';
import styles from './episode.module.scss'
import Link from 'next/link'
import { useContext } from 'react'
import Head from 'next/head';

type Episode = {
    id: string;
    title: string;
    thumbnail: string;
    members: string,
    publishedAt: string,
    duration: number,
    durationAsString: string,
    description: string,
    url: string,
  }
  
type EpisodeProps = {
    episode: Episode;
}

export default function Episode( { episode }: EpisodeProps ){
    const { play } = useContext(PlayerContext)

    return(
        <div className={styles.allInfo}>
            <Head>
                <title>{episode.title} | Podcastr</title>
            </Head>

            <div className={styles.episode}>
                <div className={styles.thumbnailContainer}>
                    <Link href="/">
                        <button type="button">
                            <img src="/arrow-left.svg" alt="Voltar"/>
                        </button>
                    </Link>
                    <Image width="700" height="300" src={episode.thumbnail} objectFit="cover"/>
                    <button type="button" onClick={() => play(episode)}>
                        <img src="/play.svg" alt="Tocar episódio"/>
                    </button>
                </div>

                <header>
                    <h1>{episode.title}</h1>
                    <span>{episode.members}</span>
                    <span>{episode.publishedAt}</span>
                    <span>{episode.durationAsString}</span>
                </header>

                <div className={styles.description} dangerouslySetInnerHTML={{ __html: episode.description}} />
            </div>
        </div>
    )
}

//Uma pagina estatica, dinamica
export const getStaticPaths: GetStaticPaths = async () => {
    //Pré carregando dados
    const { data } = await api.get('episodes', {
        params:{
            _limit: 2,
            _sort: 'published_at',
            _order: 'desc'
        }
    })

    const paths = data.map(episode => {
        return {
            params: {
                slug: episode.id
            }
        }
    })


    return{
        //Path determina oq será carregado de inicio na Build
        paths,
        //Fallback false => 404 se não foi determinado no path
        //Fallback true => Chamada pelo lado do client
        //Fallback 'blocking' => Pesssoa só sera encaminhada para tela quando tiver sido carregado (Melhor em SEO)
        fallback: 'blocking'
    }
}

export const getStaticProps: GetStaticProps = async (ctx) => {
    const { slug } = ctx.params
    const { data } = await api.get(`/episodes/${slug}`)
    
    const episode = {
        id: data.id,
        title: data.title,
        thumbnail: data.thumbnail,
        members: data.members,
        publishedAt: format(parseISO(data.published_at), 'd MMM yy', { locale: ptBR}),
        duration: Number(data.file.duration),
        durationAsString: convertDurationToTimeString(Number(data.file.duration)),
        description: data.description,
        url: data.file.url,
    }

    return{
        props: {
            episode,
        },
        revalidate: 60 * 60 * 24,
    }
}