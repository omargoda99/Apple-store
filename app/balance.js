import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { StripeProvider, CardField } from '@stripe/stripe-react-native';
import { db,FIREBASE_AUTH } from './FirebaseConfig';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { ALERT_TYPE, Dialog, AlertNotificationRoot, Toast } from 'react-native-alert-notification';
import { router } from 'expo-router';

const Balance = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const [amount, setAmount] = useState(0);
  const [cardNumber, setCardNumber] = useState(null);
  const [refundAmount, setRefundAmount] = useState(0);
  console.log(cardNumber)
  const getUserData = async () => {
    const userDocRef = doc(db, "users", FIREBASE_AUTH.currentUser.email);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      setUserData(docSnap.data());
    }
  }

  useEffect(() => {
    getUserData();
  }, []);

  const handleRecharge = async () => {
    if (cardNumber === null) {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        textBody: 'Please enter card details first .',
        autoClose: 2000,
        titleStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',

        },
        textBodyStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',
        },
      });
      return;
    }
    if (amount <= 0) {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        textBody: 'Please enter a valid amount.',
        autoClose: 2000,
        titleStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',

        },
        textBodyStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',
        },
      });
      return;
    }
    setLoading(true);
    const newBalance = userData.balance + Number(amount);
    const userDocRef = doc(db, "users", FIREBASE_AUTH.currentUser.email);
    try {
      await updateDoc(userDocRef, { balance: newBalance });
      setLoading(false);
      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        textBody: `$${amount} added to your balance successfully. Your new balance is $${newBalance.toFixed(2)}.`,
        autoClose: 3000,
        titleStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',
        },
        textBodyStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',
        },
      });
      setAmount(0);
      setUserData({ ...userData, balance: newBalance });
    } catch (error) {
      console.error("Error recharging balance: ", error);
      setLoading(false);
      Toast.show({
        type: ALERT_TYPE.ERROR,
        textBody: 'Error recharging balance. Please try again later.',
        autoClose: 3000,
        titleStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',
        },
        textBodyStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',
        },
      });
    }
  };
  const handleRefund = async () => {
    if (cardNumber === null) {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        textBody: 'Please enter card details first .',
        autoClose: 2000,
        titleStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',

        },
        textBodyStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',
        },
      });
      return;
    }
    if (refundAmount <= 0) {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        textBody: 'Please enter a valid refund amount.',
        autoClose: 2000,
        titleStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',
        },
        textBodyStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',
        },
      });
      return;
    }
    if (refundAmount > userData.balance) {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        textBody: 'Refund amount cannot be more than your balance.',
        autoClose: 2000,
        titleStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',

        },
        textBodyStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',
        },
      });
      return;
    }
    setLoading2(true);
    const newBalance = userData.balance - Number(refundAmount);
    const userDocRef = doc(db, "users", FIREBASE_AUTH.currentUser.email);
    try {
      await updateDoc(userDocRef, { balance: newBalance });
      setLoading2(false);
      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        textBody: `$${refundAmount} refunded from your balance successfully. Your new balance is $${newBalance.toFixed(2)}.`,
        autoClose: 3000,
        titleStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',
        },
        textBodyStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',
        },
      });
      setRefundAmount(0);
      setUserData({ ...userData, balance: newBalance });
    } catch (error) {
      console.error("Error refunding balance: ", error);
      setLoading2(false);
      Toast.show({
        type: ALERT_TYPE.ERROR,
        textBody: 'Error refunding balance. Please try again later.',
        autoClose: 3000,
        titleStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',
        },
        textBodyStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',
        },
      });
    }
  };

  return (
    <ScrollView style={{
    backgroundColor: '#F5F8FA',

    }}>
      <AlertNotificationRoot>
        <View style={styles.container}>

          <Text style={styles.title}>My Balance: ${userData ? userData.balance.toFixed(2) : '0.00'}</Text>
          <View style={{
            backgroundColor: '#E1E8ED',
            borderRadius: 10,
            padding: 10,
            margin: 10,
            paddingBottom: 15,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,

            elevation: 7,
          }}>
            <Text style={styles.title2}>Enter Your Card Details</Text>
            <StripeProvider>
              <CardField
                postalCodeEnabled
                style={{ width: 300, height: 50 }}
                onCardChange={(cardDetails) => {
                  setCardNumber(cardDetails.number);
                }}
              />
            </StripeProvider>
          </View>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Enter amount to recharge"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              maxLength={5}
            />


            <TouchableOpacity style={styles.button} onPress={handleRecharge} disabled={loading}>
              {loading ? (
                <Text style={{ fontFamily: 'SunshineRegular', color: '#FFFFFF' }}>Loading...</Text>
              ) : (
                <Text style={{ fontFamily: 'SunshineRegular', color: '#FFFFFF' }}>Recharge Balance</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Enter amount to refund"
              value={refundAmount}
              onChangeText={setRefundAmount}
              keyboardType="numeric"
              maxLength={5}

            />
            <TouchableOpacity style={styles.button} onPress={handleRefund} disabled={loading}>
              {loading2 ? (
                <Text style={{ fontFamily: 'SunshineRegular', color: '#FFFFFF' }}>Loading...</Text>
              ) : (
                <Text style={{ fontFamily: 'SunshineRegular', color: '#FFFFFF' }}>Request Refund</Text>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.button3} onPress={() =>
            router.navigate('contact')
          } >
            <Text style={{ fontFamily: 'SunshineRegular', color: '#FFFFFF' }}>If you facing any problem please contact us</Text>
          </TouchableOpacity>
        </View>

      </AlertNotificationRoot>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
    paddingTop: 40,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'SunshineRegular',
    fontSize: 25,
    marginBottom: 40,
    color: '#1DA1F2',
    textAlign: 'center',
  },
  title2: {
    fontFamily: 'SunshineRegular',
    fontSize: 15,
    padding: 10,
    color: '#657786',
    textAlign: 'center',
  },
  form: {
    paddingTop: 30,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    width: '90%',
    fontFamily: 'SunshineRegular',
    borderBottomColor: '#657786',
    borderBottomWidth: 1,
  },
  button: {
    backgroundColor: '#1DA1F2',
    borderRadius: 10,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 30,
    paddingRight: 30,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button3: {
    backgroundColor: '#657786',

    borderRadius: 10,
    marginTop: 40,
    padding: 20,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Balance;