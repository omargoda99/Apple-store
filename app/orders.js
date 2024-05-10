import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { collection, query, where, getDocs, doc, onSnapshot, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db,FIREBASE_AUTH } from './FirebaseConfig';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Toast, ALERT_TYPE, AlertNotificationRoot } from 'react-native-alert-notification';
const OrderPage = () => {
    const [orders, setOrders] = useState([]);
    const [cartTotal, setCartTotal] = useState(0);
    const navigation = useNavigation()
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loading2, setLoading2] = useState(false);


    const onRefresh = async () => {
        try {
            setLoading(true)
            // Fetch the user's orders from Firestore
            const currentUser = FIREBASE_AUTH.currentUser;
            if (currentUser) {
                const { uid } = currentUser;
                const ordersCollectionRef = collection(db, 'orders');
                const q = query(ordersCollectionRef, where('userId', '==', uid));
                const querySnapshot = await getDocs(q);
                const userOrders = [];
                querySnapshot.forEach((doc) => {
                    const orderData = doc.data();
                    userOrders.push(orderData);
                });
                userOrders.sort((a, b) => {
                    // Convert the timestamp strings to Date objects
                    const aDate = new Date(a.timestamp);
                    const bDate = new Date(b.timestamp);
                    // Compare the Date objects to sort the orders in descending order
                    if (aDate > bDate) return -1;
                    if (aDate < bDate) return 1;
                    return 0;
                });
                setOrders(userOrders);
                setLoading(false)
            }
        } catch (error) {
            console.error('Error fetching orders: ', error);
        } finally {
            // Set refreshing to false when the data fetching is complete
            setRefreshing(false);
        }
    };
    useEffect(() => {
        // Load cart items from Firestore when component mounts
        const currentUser = FIREBASE_AUTH.currentUser;

        if (currentUser) {
            const { uid } = currentUser;
            const cartRef = doc(db, "carts", uid);

            const unsubscribe = onSnapshot(cartRef, (cartDoc) => {
                if (cartDoc.exists()) {
                    const cartData = cartDoc.data();
                    // Calculate the total quantity of items in the cart
                    const totalQty = cartData.items.reduce((acc, item) => {
                        return acc + item.quantity;
                    }, 0);
                    setCartTotal(totalQty);
                }
            }, (error) => {
                console.error("Error getting cart document: ", error);
            });

            return unsubscribe;
        }
    }, []);
    useEffect(() => {
        const currentUser = FIREBASE_AUTH.currentUser;

        if (currentUser) {
            const { uid } = currentUser;
            const ordersCollectionRef = collection(db, 'orders');
            const q = query(ordersCollectionRef, where('userId', '==', uid));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const userOrders = [];
                querySnapshot.forEach((doc) => {
                    const orderData = doc.data();
                    userOrders.push(orderData);
                });
                userOrders.sort((a, b) => {
                    // Convert the timestamp strings to Date objects
                    const aDate = new Date(a.timestamp);
                    const bDate = new Date(b.timestamp);

                    // Compare the Date objects to sort the orders in descending order
                    if (aDate > bDate) return -1;
                    if (aDate < bDate) return 1;
                    return 0;
                });
                setOrders(userOrders);
                setLoading(false)

            }, (error) => {
                console.error('Error fetching orders: ', error);
            });
            return () => unsubscribe();
        }
    }, []);



    const deleteOrder = async (orderId, paymentMethod) => {
        try {
            if (paymentMethod === 'Paid by card') {
                Alert.alert(
                    'Cancel Order',
                    'Your money will be transferred to your balance in the app. you can refund it from your Balace. Do you want to continue?',
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                        },
                        {
                            text: 'Continue',
                            style: 'destructive',
                            onPress: async () => {
                                setLoading2(true);
                                const orderRef = doc(db, 'orders', orderId);
                                const orderDoc = await getDoc(orderRef);
                                if (orderDoc.exists()) {
                                    const orderData = orderDoc.data();
                                    const orderItems = orderData.items;

                                    // adjust quantities of each product in the order
                                    await Promise.all(
                                        orderItems.map(async (item) => {
                                            const productRef = doc(db, 'products', item.id);
                                            const productDoc = await getDoc(productRef);
                                            if (productDoc.exists()) {
                                                const productData = productDoc.data();
                                                const newQuantity = productData.quantity + item.quantity;
                                                await updateDoc(productRef, { quantity: newQuantity });
                                            }
                                        })
                                    );

                                    // transfer order total to user balance
                                    const userDocRef = doc(db, 'users', FIREBASE_AUTH.currentUser.email);
                                    const userDoc = await getDoc(userDocRef);
                                    if (userDoc.exists()) {
                                        const userData = userDoc.data();
                                        const balance = userData.balance + orderData.total;
                                        await updateDoc(userDocRef, { balance });
                                    }

                                    // delete the order document
                                    await deleteDoc(orderRef);
                                    setOrders(orders.filter((order) => order.id !== orderId));
                                    Toast.show({
                                        type: ALERT_TYPE.SUCCESS,
                                        textBody: `Order canceled and $${orderData.total.toFixed(2)} was added to your balance. Your current balance is $${userDoc.data().balance + orderData.total}.`,
                                        autoClose: 5000,
                                        titleStyle: {
                                            fontFamily: 'SunshineRegular',
                                            color: '#657786',
                                        },
                                        textBodyStyle: {
                                            fontFamily: 'SunshineRegular',
                                            color: '#657786',
                                        },
                                    });
                                }
                                setLoading2(false);
                            },
                        },
                    ],
                    {
                        titleStyle: { fontFamily: 'SunshineRegular' },
                        messageStyle: { fontFamily: 'SunshineRegular' },
                    }
                );
            } else if (paymentMethod === 'Paid with balance') {
                Alert.alert(
                    'Cancel Order',
                    'Your money will be transferred to your balance in the app. you can refund it from your Balace. Do you want to continue?',

                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                        },
                        {
                            text: 'Continue',
                            style: 'destructive',
                            onPress: async () => {
                                setLoading2(true);
                                const orderRef = doc(db, 'orders', orderId);
                                const orderDoc = await getDoc(orderRef);
                                if (orderDoc.exists()) {
                                    const orderData = orderDoc.data();
                                    const orderItems = orderData.items;

                                    // adjust quantities of each product in the order
                                    await Promise.all(
                                        orderItems.map(async (item) => {
                                            const productRef = doc(db, 'products', item.id);
                                            const productDoc = await getDoc(productRef);
                                            if (productDoc.exists()) {
                                                const productData = productDoc.data();
                                                const newQuantity = productData.quantity + item.quantity;
                                                await updateDoc(productRef, { quantity: newQuantity });
                                            }
                                        })
                                    );

                                    // transfer order total to user balance
                                    const userDocRef = doc(db, 'users', FIREBASE_AUTH.currentUser.email);
                                    const userDoc = await getDoc(userDocRef);
                                    if (userDoc.exists()) {
                                        const userData = userDoc.data();
                                        const balance = userData.balance + orderData.total;
                                        await updateDoc(userDocRef, { balance });
                                    }

                                    // delete the order document
                                    await deleteDoc(orderRef);
                                    setOrders(orders.filter((order) => order.id !== orderId));
                                    Toast.show({
                                        type: ALERT_TYPE.SUCCESS,
                                        textBody: `Order canceled and $${orderData.total.toFixed(2)} was added to your balance. Your current balance is $${userDoc.data().balance + orderData.total}.`,
                                        autoClose: 5000,
                                        titleStyle: {
                                            fontFamily: 'SunshineRegular',
                                            color: '#657786',
                                        },
                                        textBodyStyle: {
                                            fontFamily: 'SunshineRegular',
                                            color: '#657786',
                                        },
                                    });
                                }
                                setLoading2(false);
                            },
                        },
                    ],
                    {
                        titleStyle: { fontFamily: 'SunshineRegular' },
                        messageStyle: { fontFamily: 'SunshineRegular' },
                    }
                );
            } else {
                Alert.alert(
                    'Cancel Order',
                    'Are you sure you want to cancel this order?',
                    [
                        { text: 'No', style: 'cancel' },
                        {
                            text: 'Yes',
                            style: 'destructive',
                            onPress: async () => {
                                setLoading2(true);
                                const orderRef = doc(db, 'orders', orderId);
                                const orderDoc = await getDoc(orderRef);
                                if (orderDoc.exists()) {
                                    const orderData = orderDoc.data();
                                    const orderItems = orderData.items;

                                    // adjust quantities of each product in the order
                                    await Promise.all(
                                        orderItems.map(async (item) => {
                                            const productRef = doc(db, 'products', item.id);
                                            const productDoc = await getDoc(productRef);
                                            if (productDoc.exists()) {
                                                const productData = productDoc.data();
                                                const newQuantity = productData.quantity + item.quantity;
                                                await updateDoc(productRef, { quantity: newQuantity });
                                            }
                                        })
                                    );

                                    // delete the order document
                                    await deleteDoc(orderRef);
                                    setOrders(orders.filter((order) => order.id !== orderId));
                                    Toast.show({
                                        type: ALERT_TYPE.SUCCESS,
                                        textBody: 'Order canceled.',
                                        autoClose: 2000,
                                        titleStyle: {
                                            fontFamily: 'SunshineRegular',
                                            color: '#657786',
                                        },
                                        textBodyStyle: {
                                            fontFamily: 'SunshineRegular',
                                            color: '#657786',
                                        },
                                    });
                                }
                                setLoading2(false);
                            },
                        },
                    ],
                    {
                        titleStyle: { fontFamily: 'SunshineRegular' },
                        messageStyle: { fontFamily: 'SunshineRegular' },
                    }
                );
            }
        } catch (error) {
            console.error('Error canceling order:', error);
            Toast.show({
                type: ALERT_TYPE.ERROR,
                textBody: 'An error occurred while canceling the order. Please try again later.',
                autoClose: 3000,
                titleStyle: {
                    fontFamily: 'SunshineRegular',
                    color: '#657786',
                },
                textBodyStyle: {
                    fontFamily: 'SunshineRegular',
                    color: '#657786',
                },
            });
        }
    };

    const orderElements = orders.map((order) => {
        const totalQty = order.items.reduce((acc, item) => {
            return acc + item.quantity;
        }, 0);
        const itemNames = order.items.map((item) => {
            let zezo = 0;
            if (item.quantity > 1) {
                zezo = item.price - item.price * 0.1
            }

            return (
                <View style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1, paddingLeft: 10, width: 125 }}>
                            <Text style={{ fontFamily: 'SunshineRegular', color: '#657786', fontSize: 12 }}>
                                <Text style={{ fontFamily: 'lonsfont', color: "#1DA1F2", fontSize: 12 }}>Name </Text>

                                {item.name}
                            </Text>
                        </View>

                        <View style={{ flex: 1, alignItems: 'flex-start', width: 65 }}>
                            <Text style={{ fontFamily: 'SunshineRegular', color: '#657786', fontSize: 12 }}>
                                <Text style={{ fontFamily: 'lonsfont', color: "#1DA1F2", fontSize: 12 }}>Price </Text>
                                {zezo > 0 ? zezo.toFixed(0) : item.price}
                            </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: 'SunshineRegular', color: '#657786', fontSize: 12 }}>
                                <Text style={{ fontFamily: 'lonsfont', color: "#1DA1F2", fontSize: 12 }}>quantity </Text>

                                {item.quantity}
                            </Text>
                        </View>
                    </View>
                </View>
            );
        });

        return (
            <View key={order.id} style={{
                borderBottomWidth: 0.5,
                borderColor: '#657786',
                padding: 10,
            }} >


                {order.isReady === 'no' ? (


                    <TouchableOpacity onPress={() => deleteOrder(order.id, order.paymentMethod)}>
                        <Text style={styles.deleteButtonText}>Cancel order</Text>
                    </TouchableOpacity>




                ) : order.done === 'no' ? (
                    <Text style={styles.deleteButtonText2}>Order is ready for pick up</Text>
                ) : null}

                <Text style={styles.p}>Order ID:<Text style={{ fontSize: 12 }}>{order.id}</Text>
                </Text>

                <Text style={[styles.p, { paddingTop: 10 }]}>Items: <Text style={{ fontFamily: 'lonsfont' }}>{totalQty}</Text></Text>
                <Text style={[styles.p, { marginTop: 10, marginBottom: 20, backgroundColor: 'white', padding: 10, borderRadius: 10 }]}>{itemNames}</Text>

                <Text style={styles.po}><Text style={styles.poo}>subtotal: </Text>{order.subtotal}</Text>
                <Text style={styles.po}><Text style={styles.poo}>shipping: </Text> {order.shipping}</Text>
                <Text style={styles.po}>
                    <Text style={styles.poo}>payment method: </Text>
                    {order.paymentMethod === "Paid by card" ? (
                        <Text>
                            Paid by card <Feather name="check-circle" color="#1DA1F2" />
                        </Text>
                    ) : order.paymentMethod === 'Paid with balance' ? (
                        <Text>
                            Paid with balance <Feather name="check-circle" color="#1DA1F2" />
                        </Text>
                    ) : (
                        <Text>
                            Pay {order.paymentMethod}
                        </Text>
                    )}
                </Text>
                {order.discountCode ? (
                    <Text style={styles.po}><Text style={styles.poo}>discount code: </Text>"{order.discountCode}"<Text style={{ color: "#1DA1F2" }}></Text> with <Text style={{ fontFamily: 'lonsfont', color: "#1DA1F2" }}>{order.amount * 100}%</Text> discount</Text>
                ) : (null)
                }
                <Text style={styles.po}><Text style={styles.poo}>address: </Text>{order.Address}</Text>


              

                <Text style={styles.p}>Total:  <Text style={styles.price}>${order.total.toFixed(2)}</Text></Text>


                {/* Render other order details as needed */}
                <View style={styles.shippedContainer2}>
                </View>
                {order.done == 'yes' ? (
                    <>
                        <View style={styles.shippedContainer}>
                            <Text style={[styles.shippedText2]}>Ordered at {new Date(order.timestamp).toLocaleDateString()} </Text>
                            <View style={styles.shippedContainer3}>
                                <Text style={styles.shippedText}>Shipped</Text>
                                <Feather name="check-circle" size={24} color="#1DA1F2" />
                            </View>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.shippedContainer}>
                            <Text style={[styles.shippedText2]}>Ordered at {new Date(order.timestamp).toLocaleDateString()} </Text>
                            <View style={styles.shippedContainer3}>
                                <Text style={[styles.shippedText, { color: '#657786' }]}>Shipping</Text>
                                <MaterialCommunityIcons name="truck-delivery" size={24} color="#1DA1F2" />
                            </View>
                        </View>
                    </>

                )}

            </View>

        );
    });

    return (
        <View style={styles.container}>
            <AlertNotificationRoot>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1DA1F2']} />
                    }
                >
                    <View style={{
                        flexDirection: 'row',
                        borderBottomWidth: 0.5,
                        borderColor: '#657786',
                        paddingBottom: 10,
                    }}>
                        <Text style={styles.title}>My Orders </Text>
                        {orderElements.length > 0 ? (
                            <Text style={styles.title2}>{orderElements.length}</Text>
                        ) : (null)}
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#1DA1F2" style={{ marginTop: '50%' }} />
                    ) : (<>
                        {
                            orderElements.length > 0 ? (
                                <ScrollView style={styles.scrollview}>

                                    {
                                        loading2 ? (
                                            <ActivityIndicator size="small" color="#1DA1F2" style={{ alignSelf: 'center', marginTop: 10 }} />
                                        ) : (null)}

                                    {orderElements}
                                </ScrollView>
                            ) : (
                                <Text style={styles.noitems}>No orders found.</Text>
                            )
                        }
                    </>)}
                </ScrollView>
                <TouchableOpacity style={styles.cartIconContainer} onPress={() => navigation.navigate('Cart')} >
                    <Feather name="shopping-cart" size={30} color="#fff" />
                    {cartTotal > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{cartTotal}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </AlertNotificationRoot>
        </View>

    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingRight: 20,
        paddingLeft: 20,
        paddingTop:20,
        backgroundColor: '#F5F8FA',
    },
    scrollview: {
        flexGrow: 1,
        backgroundColor: '#F5F8FA',
        paddingBottom: 140,
    },
    noitems: {
        fontFamily: 'SunshineRegular',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
        color: '#657786',
    },
    image1: {
        alignSelf: 'center',
        marginTop: 60,
        height: 340,
        width: 300,
    },
    total: {
        fontFamily: 'SunshineRegular',
        fontSize: 20,
        marginBottom: 10,
        color: '#657786',
    },
    shippedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    deleteButtonText: {
        fontSize: 10,
        color: '#657786',
        padding: 5,
        fontFamily: 'SunshineRegular',
        margin: 5,
        alignSelf: 'center',
        backgroundColor: '#E1E8ED',
        borderRadius: 10
    },
    deleteButtonText2: {
        fontSize: 12,
        color: '#1DA1F2',
        padding: 5,
        fontFamily: 'SunshineRegular',
        margin: 5,
        alignSelf: 'center',
        borderRadius: 10

    },
    shippedContainer2: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    shippedContainer3: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'absolute',
        right: 0
    },
    shippedText: {
        fontFamily: 'SunshineRegular',
        fontSize: 16,
        marginRight: 10,
        color: '#1DA1F2',
    },
    shippedText2: {
        fontFamily: 'SunshineRegular',
        fontSize: 14,
        marginRight: 10,
        color: '#657786',
    },
    title: {
        fontFamily: 'SunshineRegular',
        fontSize: 20,
        alignSelf: 'center',
        marginBottom: 10,
        color: '#657786',
        borderBottomWidth: 0.5,
        borderColor: '#657786',
        padding: 10,
    },
    removeButton: {
        fontFamily: 'SunshineRegular',
        fontSize: 16,
        color: '#657786',
    },

    cartBadge: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: '#1DA1F2',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },

    cartBadgeText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },
    noReviewsText: {
        fontFamily: "SunshineRegular",
        fontSize: 16,
        textAlign: "center",
        marginTop: 10,
        color: "#657786",
    },
    cartIconContainer: {
        position: 'absolute',
        bottom: 50,
        paddingRight: 2,
        right: 20,
        backgroundColor: '#657786',
        borderRadius: 50,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        elevation: 5,
        borderColor: '#fff', // Add the borderColor property
        borderWidth: 0.2
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#E1E8ED',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 10, height: 0.1 },
        shadowOpacity: 1.5,
        shadowRadius: 1.84,
        elevation: 1,
    },
    image: {
        width: 110,
        height: 110,
        resizeMode: 'contain',
    },
    details: {
        flex: 1,
        padding: 10,
        backgroundColor: '#E1E8ED',

    },
    title: {
        fontSize: 20,
        fontFamily: 'SunshineRegular',
        marginBottom: 10,
        color: '#657786',

    },
    title2: {
        fontSize: 24,
        fontFamily: 'SunshineRegular',
        color: '#1DA1F2',
        position: 'absolute',
        right: 10
    },
    price: {
        fontSize: 16,
        fontFamily: 'SunshineRegular',
        marginBottom: 10,
        color: '#1DA1F2',
    },
    p: {
        fontSize: 20,
        fontFamily: 'SunshineRegular',
        color: '#657786',

    },
    po: {
        fontSize: 13,
        fontFamily: 'SunshineRegular',
        color: '#657786',

    },
    poo: {
        fontSize: 15,
        fontFamily: 'lonsfont',
        color: '#657786',

    },
    checkoutButton: {
        marginTop: 15,
        backgroundColor: '#657786',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignSelf: 'center',
    },
    checkoutButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        textAlign: 'center',
        fontFamily: 'SunshineRegular',
    },
    removeallButton: {
        backgroundColor: '#FF3B30',
        borderRadius: 9999,
        paddingVertical: 16,
        alignItems: 'center',
        marginVertical: 20,
        backgroundColor: '#E1E8ED',
    },
    removeallButtonText: {
        color: '#657786',
        fontFamily: 'SunshineRegular',
        fontSize: 20,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 10,
        backgroundColor: '#E1E8ED',
    },
    quantity: {
        fontSize: 20,
        fontFamily: 'SunshineRegular',
        marginHorizontal: 10,
        color: '#1DA1F2',
        backgroundColor: '#E1E8ED',
    },
});

export default OrderPage;