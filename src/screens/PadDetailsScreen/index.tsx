import React, {FC, useEffect, useState} from 'react'
import {ActivityIndicator, Platform, ScrollView, Text, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {Layout, Navigation} from 'react-native-navigation'
import {color, randomColor} from '../../util/colors'
import {InfoRow} from '../../components/infoRow'
import {LaunchListCell} from '../../components/launchListCell'
import {EmptyState} from '../../components/emptyState'
import {ComponentId, Launch, Pad} from '../../types'
import {PADS_STACK, store} from '../../navigation/navigation'
import {usePad, useRecentLaunches} from '../../api/useSpaceX'
import {LaunchDetailLayout} from '../LaunchDeatailsScreen'
import {styles} from './styles'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { State } from '../../store/reducer'
import { addToFavorites, removeFromFavorites } from '../../store/actions'
import { FavoriteButton } from '../../components/favoriteButton'

interface PadDetailsProps {
    siteId: string;
    isFavorite?: boolean;
}

const PadDetails: FC<PadDetailsProps & ComponentId> = ({siteId, isFavorite, componentId}) => {
    const {data: pad} = usePad(siteId, {})
    const {data: launches} = useRecentLaunches(pad?.site_id)

    const [gradientColors] = useState([randomColor(), randomColor()])

    const dispatch = useDispatch();
    const favoritePads = useSelector((state: State) => state.favoritePads)
    const [isStarred, setIsStarred] = useState(isFavorite);

    const handlelOnPress = (item: Pad) => { 
        if(isStarred){
            return dispatch(removeFromFavorites(item.id, 'pad'));
        } else {
            return dispatch(addToFavorites(item, 'pad'));
        } 
    };

    useEffect(()=>{
        const isFavoriteButtonState = favoritePads.find(obj => obj.id === pad?.id);
        setIsStarred(Boolean(isFavoriteButtonState))
    }, [favoritePads])


    useEffect(() => {
        if (pad?.name) {
            Navigation.mergeOptions(componentId, {
                topBar: {
                    title: {
                        text: pad.name
                    }
                }
            })
        }
    }, [pad?.name])

    if (!pad) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator />
            </View>
        )
    }

    const statusColor =
        pad.status === 'active'
            ? color.green700
            : pad.status === 'under construction'
            ? color.yellow700
            : color.red700

    return (
        <View style={styles.container}>
            <ScrollView
                contentInsetAdjustmentBehavior="never"
                contentInset={{bottom: 24}}>
                <LinearGradient colors={gradientColors} style={styles.gradient}>
                    <View style={styles.imageOverlay}>
                        <Text style={styles.missionNameText}>
                            {pad.site_name_long}
                        </Text>
                        <FavoriteButton
                            id={pad.id}
                            isFavoriteItem={Boolean(isStarred)}
                            onPress={() => handlelOnPress(pad)}
                        />
                        <View style={styles.subtitleContainer}>
                            <Text
                                style={[
                                    styles.badge,
                                    {backgroundColor: color.purple500},
                                    {marginRight: 8}
                                ]}>
                                {`${pad.attempted_launches}/${pad.successful_launches} SUCCESSFUL`}
                            </Text>
                            <Text
                                style={[
                                    styles.badge,
                                    {
                                        backgroundColor: statusColor
                                    }
                                ]}>
                                {pad.status.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                <Text style={styles.description}>{pad.details}</Text>

                <View style={styles.infoBox}>
                    <InfoRow
                        iconName="pin-outline"
                        iconText="Location"
                        title={pad.location.name}
                        subtitle={pad.location.region}
                    />
                    <InfoRow
                        iconName="navigation-variant-outline"
                        iconText="Vehicles"
                        title={pad.vehicles_launched.join(', ')}
                        subtitle={' '}
                        style={{marginTop: 24}}
                    />
                </View>

                <RecentLaunches launches={launches} />
            </ScrollView>
        </View>
    )
}

const RecentLaunches: FC<{launches?: Launch[]}> = ({launches}) => {
    const goToLaunch = (launch: Launch) => {
        Navigation.push(
            PADS_STACK,
            LaunchDetailLayout({flightNumber: launch.flight_number})
        )
    }

    return (
        <>
            <Text style={styles.recentLaunches}>{'Recent launches'}</Text>
            {launches === undefined ? (
                <EmptyState loading style={{height: 100}} />
            ) : !launches.length ? (
                <EmptyState text="No recent launches..." style={{height: 50}} />
            ) : (
                launches.map(launch => {
                    return (
                        <LaunchListCell
                            launch={launch}
                            onPress={goToLaunch}
                            key={launch.flight_number}
                        />
                    )
                })
            )}
        </>
    )
}

export const PadDetailLayoutName = 'PadDetail'

export const PadDetailLayout = (props: PadDetailsProps): Layout<PadDetailsProps> => ({
    component: {
        name: PadDetailLayoutName,
        passProps: props,
        options: {
            topBar: {
                visible: Platform.select({android: false})
            }
        }
    }
})

PadDetails.displayName = PadDetailLayoutName;
const WrappedPadDetails = (props: PadDetailsProps & ComponentId) => (
    <Provider store={store}>
        <PadDetails {...props} />
    </Provider>
);

export default WrappedPadDetails
